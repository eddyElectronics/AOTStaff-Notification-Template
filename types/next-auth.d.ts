import "next-auth";

declare module "next-auth" {
  interface Session {
    accessToken?: string;
    user: {
      name?: string | null;
      email?: string | null;
      image?: string | null;
      employeeId?: string | null;
    };
    isAuthorized?: boolean;
  }

  interface Profile {
    oid?: string;
    preferred_username?: string;
    name?: string;
    email?: string;
    employeeid?: string;
    employee_id?: string;
    employeeId?: string;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    accessToken?: string;
    idToken?: string;
    employeeId?: string;
    isAuthorized?: boolean;
  }
}
