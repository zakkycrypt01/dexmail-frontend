# DexMail Frontend

A revolutionary decentralized email platform that combines traditional email functionality with blockchain-powered crypto transfers. Send emails and crypto assets to any email address, even if the recipient doesn't have a wallet.

## 🌟 Features

### Core Email Functionality
- **Decentralized Email System**: Messages stored on IPFS with blockchain indexing
- **Traditional Email Compatibility**: Send/receive emails from Gmail, Outlook, and other providers
- **Wallet-First Authentication**: Primary login via wallet signature (Traditional email/password login coming soon)
- **Full Email Client**: Inbox, sent items, compose, and message management

### Crypto Transfer Capabilities
- **Send Crypto via Email**: Transfer ETH, ERC20 tokens, and NFTs to other DexMail users
- **Cross-Platform Transfers**: (Coming Soon) Transfer to non-DexMail addresses with claim link generation
- **No Wallet Required**: Recipients can claim crypto without an existing wallet
- **Smart Contract Wallets**: Automatic deterministic wallet generation for email addresses
- **Gas-Sponsored Claims**: Optional gasless transactions for recipients
- **Multi-Asset Support**: 
  - Native ETH transfers
  - ERC20 tokens (USDC, USDT, DAI, etc.)
  - ERC721 NFTs
  - Batch transfers
  - **Balance Guard**: Built-in validation prevents sending more than you own

### User Experience
- **One-Click Onboarding**: Recipients claim crypto and create wallets in one step
- **Email Content Parsing**: Automatic detection of crypto transfer markers like `[SEND: 100 USDC]`
- **Claim Links**: Secure, time-limited claim links sent via email
- **Wallet Management**: Link existing wallets or create new ones
- **Transaction History**: Track all sent and received emails with crypto attachments

## 🏗️ Architecture

### Tech Stack
- **Framework**: Next.js 15.3.3 with React 18
- **Styling**: Tailwind CSS with custom design system
- **UI Components**: Radix UI primitives
- **Blockchain**: 
  - Ethers.js v6 for smart contract interactions
  - Wagmi v2 for wallet connections
  - RainbowKit for wallet UI
  - Viem for type-safe Ethereum interactions
- **State Management**: React Context API
- **Form Handling**: React Hook Form with Zod validation
- **Date Handling**: date-fns
- **Authentication**: JWT tokens with bcrypt password hashing

### Smart Contracts
- **BaseMailer.sol**: Main email protocol contract for message indexing
- **TrustedRelayer.sol**: Handles email-to-wallet mappings and crypto transfers
- **Account Abstraction**: ERC-4337 compatible smart contract wallets

## 📁 Project Structure

```
DexMail-frontend/
├── contracts/            # Smart contract files
│   ├── BaseMailer.sol    # Core protocol contract
│   ├── TrustedRelayer.sol # Relayer logic
│   └── abi.ts            # Generated ABIs
├── docs/                 # Documentation
│   ├── blueprint.md
│   └── frontend-services.md
├── public/               # Static assets
│   ├── illustrations/    # Onboarding & Auth SVGs
│   └── ...
├── scripts/              # Utility & Test scripts
│   ├── generate-wallet.ts
│   └── test-outbound-email.ts
├── src/
│   ├── app/                    # Next.js app router pages
│   │   ├── (auth)/            # Authentication (login/register)
│   │   ├── dashboard/         # Main app interface
│   │   │   ├── inbox/
│   │   │   ├── sent/
│   │   │   ├── drafts/
│   │   │   └── profile/
│   │   ├── onboarding/        # New user flow
│   │   └── api/               # Backend API routes
│   │       ├── auth/          # Auth endpoints
│   │       ├── email/         # Email & Drafts management
│   │       ├── tokens/        # Token fetching
│   │       └── wallet/        # Wallet operations
│   ├── components/            # React components
│   │   ├── mail/             # Email-specific (Compose, List, Display)
│   │   ├── ui/               # Reusable UI primitives
│   │   └── providers/        # Context providers wrapper
│   ├── contexts/             # React contexts
│   │   ├── auth-context.tsx  # Auth state
│   │   └── mail-context.tsx  # Email data & actions
│   ├── hooks/                # Custom hooks (useWallet, useTable)
│   ├── lib/                  # Utilities & Services
│   │   ├── models/           # Mongoose schemas
│   │   ├── services/         # API integations (mail, nft, token)
│   │   └── utils.ts          # Helpers
│   └── types/                # TypeScript definitions
├── next.config.ts        # Next.js configuration
├── tailwind.config.ts    # Tailwind CSS configuration
├── tsconfig.json         # TypeScript configuration
└── README.md             # Project documentation
```

## 🚀 Getting Started

### Prerequisites
- Node.js 20+ 
- npm or yarn
- A wallet (MetaMask, Coinbase Wallet, etc.)
- Access to Base network (testnet or mainnet)

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd DexMail-frontend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   
   Create a `.env.local` file in the root directory:
   ```env
   # Blockchain Configuration
   NEXT_PUBLIC_CHAIN_ID=8453
   NEXT_PUBLIC_RPC_URL=https://mainnet.base.org
   
   # Smart Contract Addresses
   NEXT_PUBLIC_BASE_MAILER_ADDRESS=0x...
   NEXT_PUBLIC_TRUSTED_RELAYER_ADDRESS=0x...
   
   # API Configuration
   NEXT_PUBLIC_API_URL=http://localhost:4000/api
   
   # IPFS Configuration
   NEXT_PUBLIC_IPFS_GATEWAY=https://ipfs.io/ipfs/
   
   # Authentication
   JWT_SECRET=your-secret-key
   
   # Database (MongoDB)
   MONGODB_URI=mongodb://localhost:27017/dexmail
   
   # Email Server (optional)
   SMTP_HOST=localhost
   SMTP_PORT=2525
   IMAP_HOST=localhost
   IMAP_PORT=1143
   ```

4. **Run the development server**
   ```bash
   npm run dev
   ```

5. **Open your browser**
   
   Navigate to [http://localhost:3000](http://localhost:3000)

### Building for Production

```bash
npm run build
npm start
```

## 📖 Usage Guide

### Sending an Email with Crypto
> **Note:** Currently, crypto attachments are only supported when sending to other `@dexmail.app` addresses. Cross-platform transfers are coming soon.

#### Method 1: Using Email Content Markers
```
Hey John,

Thanks for the great work! Here's your payment.

[SEND: 100 USDC]

Best,
Alice
```

#### Method 2: Using the Compose UI
1. Click "Compose" in the dashboard
2. Fill in recipient (must be `@dexmail.app`), subject, and message
3. Click "Attach Crypto"
4. Select token type and amount
5. Approve the transaction in your wallet
6. Send the email

### Claiming Crypto

1. **Receive Email**: Recipient gets an email notification
2. **Click Claim Link**: Opens the claim page
3. **Verify Email**: Enter verification code sent to email
4. **Deploy Wallet**: System creates a smart contract wallet (gas-sponsored)
5. **Access Funds**: Crypto is immediately available in the new wallet

### Wallet Authentication

#### Connect Wallet (Default)
1. Click "Connect Wallet" on the login page
2. Select your wallet provider (MetaMask, Coinbase, etc.)
3. Sign the authentication message
4. Access your account

#### Traditional Login (Coming Soon)
1. Feature currently under development
2. will support email/password login with optional wallet linking

## 🔧 Development

### Available Scripts

- `npm run dev` - Start development server with Turbopack
- `npm run build` - Build for production
- `npm start` - Start production server
- `npm run lint` - Run ESLint
- `npm run typecheck` - Run TypeScript type checking
- `npm run start:mail-server` - Start local SMTP/IMAP server

### Key Development Files

- **`src/lib/services/`**: All API interaction logic
- **`src/contexts/`**: Global state management
- **`src/components/mail/`**: Email UI components
- **`contracts/`**: Smart contract ABIs and deployment info

### Testing

The application includes comprehensive testing for:
- Email sending and receiving
- Crypto transfer flows
- Wallet deployment and claiming
- Authentication flows

## 🔐 Security

### Best Practices
- **Non-Custodial**: Platform never holds user funds
- **End-to-End Encryption**: Email content encrypted before IPFS storage
- **Deterministic Wallets**: CREATE2 for predictable wallet addresses
- **Time-Limited Claims**: Claim links expire after 7 days
- **Email Verification**: Required before wallet deployment
- **Gas Sponsorship**: Optional gasless transactions via ERC-4337

### Smart Contract Security
- Account Abstraction (ERC-4337) for enhanced security
- Multi-signature support for high-value transfers
- Upgradeable contracts with governance

## 🌐 API Documentation

Full API documentation is available in [`api.md`](./api.md).

### Key Endpoints

#### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login with email/password or wallet
- `POST /api/auth/challenge` - Get wallet signature challenge

#### Mail
- `POST /api/mail/send` - Send email with optional crypto
- `GET /api/mail/inbox` - Get inbox messages
- `GET /api/mail/sent` - Get sent messages
- `GET /api/mail/message/:id` - Get specific message

#### Crypto Transfers
- `POST /api/crypto/send` - Send crypto to email
- `GET /api/crypto/pending/:email` - Get pending transfers
- `GET /api/crypto/wallet/:email` - Get wallet for email

#### Wallet Management
- `POST /api/wallet/deploy` - Deploy smart wallet
- `POST /api/wallet/sponsor/transaction` - Execute gasless transaction

#### Claims
- `POST /api/claim/verify` - Verify claim token
- `POST /api/claim/deploy` - Deploy wallet and claim assets

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License.

## 🙏 Acknowledgments

- Built on [Base](https://base.org) blockchain
- Uses [RainbowKit](https://www.rainbowkit.com/) for wallet connections
- UI components from [Radix UI](https://www.radix-ui.com/)
- Inspired by the vision of decentralized communication

## 📞 Support

For questions and support:
- Open an issue on GitHub
- Check the [API documentation](./api.md)
- Review the [idea document](./idea.txt) for detailed specifications

## 🗺️ Roadmap

- [ ] Mobile app (React Native)
- [ ] Multi-chain support (Ethereum, Polygon, Arbitrum)
- [ ] Email templates and scheduling
- [ ] Advanced spam filtering
- [ ] Group email support
- [ ] Email aliases
- [ ] Custom domain support
- [ ] Integration with traditional email providers (Gmail API, Outlook API)
- [ ] Enhanced NFT gallery view
- [ ] DeFi integrations (send yield-bearing tokens)
- [ ] DAO governance for protocol upgrades

---

**Built with ❤️ for the decentralized future**
