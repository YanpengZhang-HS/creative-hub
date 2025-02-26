import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Home - AI Studio',
  description: 'Create amazing videos with AI',
};

export default function HomeLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
} 