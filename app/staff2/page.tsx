// app/staff2/page.tsx
export const dynamic = 'force-dynamic';
export const revalidate = 0;

import StaffClient from './Client';

export default function Page() {
  return <StaffClient />;
}
