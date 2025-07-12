# Game Share - Premium Game Marketplace

A sleek and modern game marketplace built with Next.js, featuring a sophisticated black, white, and gold design system.

## Features

- **Marketplace**: Browse and rent premium games with advanced filtering
- **Profile Management**: Track rentings, listings, and earnings with an elegant sidebar interface
- **Token Store**: Purchase token packages and redeem gift codes
- **Support Center**: Comprehensive FAQ and ticket system with live chat widget
- **Responsive Design**: Optimized for mobile, tablet, and desktop experiences
- **Smooth Animations**: Powered by Framer Motion for premium user interactions

## Design System

- **Colors**: Black (#000000), White (#FFFFFF), Gold (#D4AF37)
- **Typography**: Playfair Display for headings, Inter for body text
- **Layout**: 12-column responsive grid with consistent spacing
- **Accessibility**: WCAG 2.1 AA compliant with proper contrast ratios

## Tech Stack

- **Framework**: Next.js 14 with App Router
- **Styling**: Tailwind CSS with custom design tokens
- **Components**: shadcn/ui component library
- **Animations**: Framer Motion
- **Icons**: Lucide React
- **Fonts**: Google Fonts (Inter, Playfair Display)

## Getting Started

### Prerequisites

- Node.js 18+ 
- npm or yarn

### Installation

1. Clone the repository:
\`\`\`bash
git clone <repository-url>
cd game-share-marketplace
\`\`\`

2. Install dependencies:
\`\`\`bash
npm install
# or
yarn install
\`\`\`

3. Run the development server:
\`\`\`bash
npm run dev
# or
yarn dev
\`\`\`

4. Open [http://localhost:3000](http://localhost:3000) in your browser.

### Build for Production

\`\`\`bash
npm run build
npm start
# or
yarn build
yarn start
\`\`\`

## Project Structure

\`\`\`
├── app/                    # Next.js App Router pages
│   ├── marketplace/        # Game marketplace page
│   ├── profile/           # User profile with sidebar
│   ├── store/             # Token store page
│   ├── support/           # Support center page
│   ├── layout.tsx         # Root layout
│   └── globals.css        # Global styles
├── components/            # Reusable components
│   ├── ui/               # shadcn/ui components
│   ├── navigation.tsx    # Main navigation bar
│   └── game-card.tsx     # Game card component
└── tailwind.config.ts    # Tailwind configuration
\`\`\`

## Key Components

### Navigation
- Persistent top navigation with token balance
- Active page indicators with smooth animations
- Responsive design for all screen sizes

### Game Cards
- Interactive hover effects with gold outlines
- Token pricing and rating displays
- Status indicators for hosting/renting

### Profile Sidebar
- User stats and token balance
- Tabbed interface for rentings, listings, and earnings
- Built with shadcn/ui Sidebar component

### Token Store
- Gradient card designs for token packages
- Featured gift code carousel
- Free token earning opportunities

### Support Center
- Expandable FAQ accordion
- Contact form with validation
- Floating live chat widget

## Deployment

### Vercel (Recommended)

1. Push your code to GitHub
2. Connect your repository to Vercel
3. Deploy with zero configuration

### Other Platforms

The app can be deployed to any platform that supports Next.js:
- Netlify
- Railway
- DigitalOcean App Platform
- AWS Amplify

## Customization

### Colors
Update the color palette in `tailwind.config.ts` and `globals.css`:

\`\`\`typescript
colors: {
  gold: '#D4AF37', // Change to your preferred accent color
}
\`\`\`

### Typography
Modify font families in `app/layout.tsx`:

\`\`\`typescript
const customFont = YourFont({ subsets: ['latin'] })
\`\`\`

### Components
All components are built with Tailwind CSS and can be easily customized by modifying the className props.

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## License

This project is licensed under the MIT License.
