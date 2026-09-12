import { redirect } from 'next/navigation';

/**
 * /admin → redirect to /admin/dashboard
 * The (panel) route group handles the actual dashboard rendering.
 */
export default function AdminPage() {
  redirect('/admin/dashboard');
}
