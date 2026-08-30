import authIllustration from '../assets/brand/auth-illustration.png';

// Branded illustration shown alongside the login/register forms on wide
// screens — hidden on narrow viewports (see .auth-side in index.css) so the
// form stays the only thing on screen on mobile.
function AuthSidePanel() {
  return (
    <div className="auth-side" aria-hidden="true">
      <img src={authIllustration} alt="" className="auth-side-illustration" />
      <h2 className="auth-side-title">Healthier Smiles, Brighter Days</h2>
      <p className="auth-side-subtitle">Your Personal Oral Health Advisor &amp; Triage Tool</p>
    </div>
  );
}

export default AuthSidePanel;
