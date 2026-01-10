import NextAuth, { NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";

const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      authorization: {
        params: {
          prompt: "consent",
          access_type: "offline",
          response_type: "code",
          scope: [
            "openid",
            "https://www.googleapis.com/auth/userinfo.email",
            "https://www.googleapis.com/auth/userinfo.profile",
            // Future scopes for Google Calendar, Gmail, Drive
            // 'https://www.googleapis.com/auth/calendar',
            // 'https://www.googleapis.com/auth/gmail.readonly',
            // 'https://www.googleapis.com/auth/drive.readonly',
          ].join(" "),
        },
      },
    }),
  ],
  callbacks: {
    async signIn({ user }) {
      // Backend handles email whitelist validation
      // No need to duplicate it here
      console.log("[NEXTAUTH] Sign-in attempt for:", user.email);
      return true;
    },
    async jwt({ token, account, user }) {
      // Initial sign in - store tokens
      if (account && user) {
        console.log("[NEXTAUTH] JWT callback - Initial sign in", {
          email: user.email,
          hasAccessToken: !!account.access_token,
          hasRefreshToken: !!account.refresh_token,
        });

        // Verify with backend API
        try {
          const backendUrl =
            process.env.NEXT_PUBLIC_API_URL || "https://bwaincell.fly.dev";
          const response = await globalThis.fetch(
            `${backendUrl}/api/auth/google/verify`,
            {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                idToken: account.id_token, // Send Google ID token (required by backend)
              }),
            },
          );

          if (!response.ok) {
            console.error(
              "[NEXTAUTH] Backend verification failed:",
              response.status,
            );
            throw new Error("Backend verification failed");
          }

          const data = await response.json();

          if (!data.success || !data.data?.accessToken) {
            console.error(
              "[NEXTAUTH] Backend verification failed - no access token",
            );
            throw new Error("Backend did not return access token");
          }

          console.log("[NEXTAUTH] Backend verification successful", {
            email: user.email,
            hasBackendToken: !!data.data.accessToken,
          });

          return {
            ...token,
            accessToken: data.data.accessToken, // Backend JWT token
            refreshToken: data.data.refreshToken, // Backend refresh token
            googleAccessToken: account.access_token,
            googleRefreshToken: account.refresh_token,
            email: user.email,
            name: user.name,
            picture: user.image,
          };
        } catch (error) {
          console.error("[NEXTAUTH] Backend verification error:", error);
          // Don't allow login if backend verification fails
          throw new Error("Backend authentication failed");
        }
      }

      return token;
    },
    async session({ session, token }) {
      // Add custom fields to session
      return {
        ...session,
        accessToken: token.accessToken as string,
        refreshToken: token.refreshToken as string,
        googleAccessToken: token.googleAccessToken as string,
        googleRefreshToken: token.googleRefreshToken as string,
        user: {
          ...session.user,
          email: token.email as string,
          name: token.name as string,
          image: token.picture as string,
        },
      };
    },
  },
  pages: {
    signIn: "/login",
    error: "/login",
  },
  session: {
    strategy: "jwt",
  },
  secret: process.env.NEXTAUTH_SECRET,
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
