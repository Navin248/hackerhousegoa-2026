import { Metadata } from 'next';
import Link from 'next/link';

type Props = {
  params: Promise<{ id: string }>
}

// Generate Dynamic Metadata for Twitter OG
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  
  // In production, this would be the actual domain (e.g. https://hhgoa.com)
  // For Vercel, you'd use process.env.VERCEL_URL
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://hhgoa.com'; 
  const imageUrl = `${baseUrl}/shares/${id}.png`;

  return {
    title: 'HH Goa 2026 Signal',
    description: 'Check out my Hacker House Goa 2026 profile frame / Builder ID.',
    openGraph: {
      title: 'HH Goa 2026 Signal',
      description: 'Check out my Hacker House Goa 2026 profile frame / Builder ID.',
      images: [
        {
          url: imageUrl,
          width: 1080,
          height: 1080,
          alt: 'HH Goa 2026 Artifact',
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title: 'HH Goa 2026 Signal',
      description: 'Check out my Hacker House Goa 2026 profile frame / Builder ID.',
      images: [imageUrl],
    },
  };
}

export default async function SharePage({ params }: Props) {
  const { id } = await params;
  const imageUrl = `/shares/${id}.png`;

  return (
    <div className="container animated-entrance" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '80vh' }}>
      <header className="custom-header" style={{ marginBottom: '2rem' }}>
        <div className="logo-lockup">
          <span className="word">HACKER</span>
          <img src="/assets/goa_hindi.svg" alt="Goa" className="goa-hindi-animated" />
          <span className="word">HOUSE</span>
        </div>
      </header>

      <div style={{ maxWidth: '600px', width: '100%', padding: '1rem', background: '#fffbe8', borderRadius: '12px', boxShadow: '8px 10px 0 rgba(0, 0, 0, 0.25)', textAlign: 'center' }}>
        <h2 style={{ fontFamily: 'Imbue, serif', color: '#0b6839', fontSize: '2rem', marginBottom: '1rem' }}>
          SIGNAL ACQUIRED
        </h2>
        
        <img src={imageUrl} alt="Generated Signal" style={{ width: '100%', borderRadius: '8px', border: '2px solid rgba(11, 104, 57, 0.2)' }} />
        
        <div style={{ marginTop: '1.5rem' }}>
          <Link href="/">
            <button className="btn btn-primary" style={{ width: '100%' }}>
              BUILD YOUR OWN SIGNAL
            </button>
          </Link>
        </div>
      </div>
    </div>
  );
}
