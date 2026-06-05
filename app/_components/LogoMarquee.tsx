type Logo = { id: number; name: string; logo: string };

// Curated sample of real businesses from the catalog (logos served by buyme.co.il).
const LOGOS: Logo[] = [
  { id: 2208, name: "adidas", logo: "https://buyme.co.il/files/siteNewLogo2208.jpg" },
  { id: 4747, name: "CASTRO", logo: "https://buyme.co.il/files/siteNewLogo4747.jpg" },
  { id: 14570, name: "Fox Home", logo: "https://buyme.co.il/files/siteNewLogo14570.jpg" },
  { id: 17574024, name: "TERMINAL X", logo: "https://buyme.co.il/files/siteNewLogo17574024.jpg" },
  { id: 2388927, name: "H&M", logo: "https://buyme.co.il/files/siteNewLogo2388927.jpg" },
  { id: 4252878, name: "MANGO", logo: "https://buyme.co.il/files/siteNewLogo4252878.jpg" },
  { id: 997194, name: "American Eagle", logo: "https://buyme.co.il/files/siteNewLogo997194.jpg" },
  { id: 997210, name: "GOLF&CO", logo: "https://buyme.co.il/files/siteNewLogo997210.jpg" },
  { id: 8180660, name: "MAC", logo: "https://buyme.co.il/files/siteNewLogo8180660.jpg" },
  { id: 12030762, name: "Max Brenner", logo: "https://buyme.co.il/files/siteNewLogo12030762.jpg" },
  { id: 351980, name: "Cafe Greg", logo: "https://buyme.co.il/files/siteNewLogo351980.jpg" },
  { id: 22840, name: "Cafe Cafe", logo: "https://buyme.co.il/files/siteNewLogo22840.jpg" },
  { id: 1335655, name: "Shilav", logo: "https://buyme.co.il/files/siteNewLogo1335655.jpg" },
  { id: 7693613, name: "WeShoes", logo: "https://buyme.co.il/files/siteNewLogo7693613.jpg" },
];

export function LogoMarquee() {
  const row = [...LOGOS, ...LOGOS]; // duplicated for a seamless -50% loop
  return (
    <div className="marquee" aria-hidden="true">
      <div className="marquee-track">
        {row.map((l, i) => (
          <div className="logo-chip" key={`${l.id}-${i}`}>
            {/* plain <img>: cross-origin logos, no Next image optimization needed */}
            <img src={l.logo} alt={l.name} loading="lazy" />
          </div>
        ))}
      </div>
    </div>
  );
}
