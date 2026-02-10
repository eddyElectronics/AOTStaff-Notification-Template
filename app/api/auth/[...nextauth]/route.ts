import NextAuth from "next-auth";
import AzureADProvider from "next-auth/providers/azure-ad";

const AIRPORT_API_URL = process.env.AIRPORT_API_URL_PROCEDURE;
const AIRPORT_API_KEY = process.env.AIRPORT_API_KEY;
const AIRPORT_DATABASE = process.env.NEXT_PUBLIC_AIRPORT_DATABASE || 'Notification';
const PROC_CHECK_AUTH = process.env.PROC_CHECK_AUTHORIZED_USER || 'sp_CheckAuthorizedUser';

// Function to get employee ID from Microsoft Graph API
async function getEmployeeDataFromGraph(accessToken: string): Promise<{ employeeId: string | null }> {
  try {
    // Get user profile
    const response = await fetch('https://graph.microsoft.com/v1.0/me?$select=employeeId,onPremisesSamAccountName,mailNickname', {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
      },
    });

    if (!response.ok) {
      console.error('Graph API error:', response.status);
      return { employeeId: null };
    }

    const data = await response.json();
    console.log('Microsoft Graph user data:', JSON.stringify(data, null, 2));
    
    const employeeId = data.employeeId || data.onPremisesSamAccountName || data.mailNickname || null;

    return { employeeId };
  } catch (error) {
    console.error('Error fetching from Graph API:', error);
    return { employeeId: null };
  }
}

// Function to check if user is authorized and is admin
async function checkUserAuthorization(employeeId: string): Promise<{ isAuthorized: boolean; isAdmin: boolean }> {
  if (!AIRPORT_API_URL || !AIRPORT_API_KEY) {
    console.warn('Airport API not configured, skipping authorization check');
    return { isAuthorized: true, isAdmin: false }; // Allow if API not configured
  }

  try {
    const response = await fetch(AIRPORT_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': AIRPORT_API_KEY,
      },
      body: JSON.stringify({
        database: AIRPORT_DATABASE,
        procedure: PROC_CHECK_AUTH,
        parameters: {
          EmployeeId: employeeId,
        },
      }),
    });

    if (!response.ok) {
      console.error('Authorization check failed:', response.status);
      return { isAuthorized: false, isAdmin: false };
    }

    const data = await response.json();
    
    console.log('Authorization API response:', JSON.stringify(data, null, 2));
    
    // Check if user is found and authorized - API returns { success, data: [...] }
    const resultData = data.data || data;
    if (resultData && Array.isArray(resultData) && resultData.length > 0) {
      const user = resultData[0];
      console.log('IsAuthorized value:', user.IsAuthorized, 'IsAdmin:', user.IsAdmin);
      return {
        isAuthorized: user.IsAuthorized === 1 || user.IsAuthorized === true,
        isAdmin: user.IsAdmin === 1 || user.IsAdmin === true,
      };
    }
    
    console.log('No data returned from authorization check');
    return { isAuthorized: false, isAdmin: false };
  } catch (error) {
    console.error('Error checking authorization:', error);
    return { isAuthorized: false, isAdmin: false };
  }
}

const handler = NextAuth({
  providers: [
    AzureADProvider({
      clientId: process.env.AZURE_AD_CLIENT_ID!,
      clientSecret: process.env.AZURE_AD_CLIENT_SECRET!,
      tenantId: process.env.AZURE_AD_TENANT_ID!,
      authorization: {
        params: {
          scope: 'openid profile email User.Read',
        },
      },
    }),
  ],
  callbacks: {
    async jwt({ token, account, profile }) {
      if (account) {
        token.accessToken = account.access_token;
        token.idToken = account.id_token;
        
        // Get employeeId from Microsoft Graph API (photo removed to avoid HTTP 431)
        if (account.access_token) {
          const { employeeId } = await getEmployeeDataFromGraph(account.access_token);
          if (employeeId) {
            token.employeeId = employeeId;
            // Note: photo removed from JWT to prevent cookie size overflow
            console.log('EmployeeId from Graph API:', employeeId);
            
            // Check authorization against database
            const authResult = await checkUserAuthorization(employeeId);
            token.isAuthorized = authResult.isAuthorized;
            token.isAdmin = authResult.isAdmin;
            console.log('Authorization result for', employeeId, ':', authResult);
          } else {
            console.log('No employeeId found from Graph API');
            token.isAuthorized = false;
            token.isAdmin = false;
          }
        }
      }
      if (profile) {
        token.name = profile.name;
        token.email = profile.email;
      }
      return token;
    },
    async session({ session, token }) {
      session.accessToken = token.accessToken as string;
      session.user.employeeId = token.employeeId as string;
      // Photo removed from session to prevent HTTP 431 error
      session.isAuthorized = token.isAuthorized as boolean;
      session.isAdmin = token.isAdmin as boolean;
      return session;
    },
  },
  pages: {
    signIn: '/login',
  },
});

export { handler as GET, handler as POST };
