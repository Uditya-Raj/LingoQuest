import { redirect } from 'next/navigation'

/** Legacy welcome path — keep bookmarks working. */
export default function WelcomeRedirect() {
  redirect('/')
}
