import NextAuth from "next-auth";
import AzureADProvider from "next-auth/providers/azure-ad";

const AIRPORT_API_URL = process.env.AIRPORT_API_URL_PROCEDURE;
const AIRPORT_API_KEY = process.env.AIRPORT_API_KEY;
const AIRPORT_DATABASE = process.env.NEXT_PUBLIC_AIRPORT_DATABASE || 'Notification';
const PROC_CHECK_AUTH = process.env.PROC_CHECK_AUTHORIZED_USER || 'sp_CheckAuthorizedUser';

// Function to get employee ID from Microsoft Graph API
async function getEmployeeIdFromGraph(accessToken: string): Promise<string | null> {
  try {
    const response = await fetch('https://graph.microsoft.com/v1.0/me?$select=employeeId,onPremisesSamAccountName,mailNickname', {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
      },
    });

    if (!response.ok) {
      console.error('Graph API error:', response.status);
      return null;
    }

    const data = await response.json();
    console.log('Microsoft Graph user data:', JSON.stringify(data, null, 2));
    
    // Return employeeId or fallback to onPremisesSamAccountName
    return data.employeeId || data.onPremisesSamAccountName || data.mailNickname || null;
  } catch (error) {
    console.error('Error fetching from Graph API:', error);
    return null;
  }
}

// Function to check if user is authorized
async function checkUserAuthorization(employeeId: string): Promise<boolean> {
  if (!AIRPORT_API_URL || !AIRPORT_API_KEY) {
    console.warn('Airport API not configured, skipping authorization check');
    return true; // Allow if API not configured
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
      return false;
    }

    const data = await response.json();
    
    console.log('Authorization API response:', JSON.stringify(data, null, 2));
    
    // Check if user is found and authorized - API returns { success, data: [...] }
    const resultData = data.data || data;
    if (resultData && Array.isArray(resultData) && resultData.length > 0) {
      console.log('IsAuthorized value:', resultData[0].IsAuthorized, 'type:', typeof resultData[0].IsAuthorized);
      return resultData[0].IsAuthorized === 1 || resultData[0].IsAuthorized === true;
    }
    
    console.log('No data returned from authorization check');
    return false;
  } catch (error) {
    console.error('Error checking authorization:', error);
    return false;
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
        
        // Get employeeId from Microsoft Graph API
        if (account.access_token) {
          const graphEmployeeId = await getEmployeeIdFromGraph(account.access_token);
          if (graphEmployeeId) {
            token.employeeId = graphEmployeeId;
            console.log('EmployeeId from Graph API:', graphEmployeeId);
            
            // Check authorization against database
            token.isAuthorized = await checkUserAuthorization(graphEmployeeId);
            console.log('Authorization result for', graphEmployeeId, ':', token.isAuthorized);
          } else {
            console.log('No employeeId found from Graph API');
            token.isAuthorized = false;
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
      session.isAuthorized = token.isAuthorized as boolean;
      return session;
    },
  },
  pages: {
    signIn: '/login',
  },
});

export { handler as GET, handler as POST };
