import Link from 'next/link';
import Navbar from '@/components/Navbar';

export default function NotFound() {
  return (
    <div className="page-wrapper" style={{ justifyContent: 'center', textAlign: 'center' }}>
      <Navbar />
      <div className="container">
        <h1 className="section-title" style={{ fontSize: '6rem' }}>404</h1>
        <h2 style={{ marginBottom: '24px' }}>Lost in the Labs?</h2>
        <p style={{ color: 'var(--text-muted)', marginBottom: '40px' }}>The account page you're looking for doesn't exist or has moved.</p>
        <Link href="/dashboard" className="premium-btn">Return to Dashboard</Link>
      </div>
    </div>
  );
}
