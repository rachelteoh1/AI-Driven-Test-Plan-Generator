
import logo from "../../assets/keysight.png"
import { COLORS, FONTSIZE ,FONTWEIGHT} from "../../lib/styles"

export function Logo({ 
  text = "KeysightGPT", 
  size = "md", 
  centered = false, 
  className 
}) {
  // Define text sizes based on our constants
  const textSize = {
    sm: FONTSIZE.xl,      // 1.25rem (20px)
    md: FONTSIZE["2xl"],  // 1.5rem (24px)
    lg: FONTSIZE["3xl"]   // 1.875rem (30px)
  }[size]

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      gap: '0.75rem',
      ...(centered && { justifyContent: 'center' })
    }} className={className}>
     
      <img 
        src={logo} 
        alt="Keysight Logo"
        style={{
          width: '3rem',
          height: '2rem',
          objectFit: 'contain'
        }}
      />
      
      {text && (
        <h1 style={{
          fontWeight: FONTWEIGHT.bold,
          color: COLORS.black,
          fontSize: textSize
        }}>
          {text}
        </h1>
      )}
    </div>
  )
}