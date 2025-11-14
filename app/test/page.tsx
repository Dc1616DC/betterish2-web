export default function TestPage() {
  return (
    <div style={{ padding: '40px', textAlign: 'center' }}>
      <h1 style={{ fontSize: '48px', color: '#2563eb' }}>✅ Server Works!</h1>
      <p style={{ fontSize: '24px', marginTop: '20px' }}>
        If you can see this, the app is running correctly.
      </p>
      <p style={{ marginTop: '20px' }}>
        <a href="/login" style={{ color: '#2563eb', fontSize: '18px' }}>
          Go to Login Page →
        </a>
      </p>
    </div>
  );
}
