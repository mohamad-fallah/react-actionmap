import { AppActionProvider } from './action-provider'

async function getCurrentUserPermissions(): Promise<readonly string[]> {
  return ['dashboard.read', 'settings.read']
}

export default async function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const permissions = await getCurrentUserPermissions()

  return (
    <html lang="en">
      <body>
        <AppActionProvider permissions={permissions}>
          {children}
        </AppActionProvider>
      </body>
    </html>
  )
}
