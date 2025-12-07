'use client';

import { ConnectButton } from '@rainbow-me/rainbowkit';
import Link from "next/link";
import Image from "next/image";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Wallet, Loader2, CheckCircle, AlertCircle } from "lucide-react";
import { useWallet } from "@/hooks/use-wallet";
import { useBasename } from "@/hooks/use-basename";
import { useAuth } from "@/contexts/auth-context";
import { useToast } from "@/hooks/use-toast";

export default function RegisterPage() {
  const router = useRouter();
  const { toast } = useToast();
  const { register } = useAuth();
  const {
    address,
    isConnected,
    isConnecting,
    isSigning,
    isAuthenticating,
    connectWallet,
    disconnect,
    registerWithWallet
  } = useWallet();
  const {
    basename,
    isLoading: isFetchingBasename,
    error: basenameError,
    fetchBasename,
    generateEmailFromBasename
  } = useBasename();

  const [useWalletAuth, setUseWalletAuth] = useState(true);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [generatedEmail, setGeneratedEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [authComplete, setAuthComplete] = useState(false);
  const [error, setError] = useState('');

  const handleWalletConnect = async () => {
    try {
      setError('');
      await connectWallet();

      // Once connected, fetch basename
      if (address) {
        const fetchedBasename = await fetchBasename(address);
        if (fetchedBasename) {
          const emailAddress = generateEmailFromBasename(fetchedBasename);
          setGeneratedEmail(emailAddress);
          setEmail(emailAddress); // Set as default but allow editing
        }
      }
    } catch (error) {
      setError('Failed to connect wallet or fetch basename');
      toast({
        title: "Connection Failed",
        description: "Failed to connect wallet. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleWalletRegistration = async () => {
    if (!email.trim()) {
      setError('Please enter an email address');
      return;
    }

    if (!isConnected || !address) {
      setError('Please connect your wallet first');
      return;
    }

    const constructedEmail = `${email}@${process.env.NEXT_PUBLIC_DOMAIN}`;
    console.log('handleWalletRegistration called with email:', constructedEmail);

    try {
      setError('');

      // Use the wallet hook's registerWithWallet which handles signature
      await registerWithWallet(constructedEmail);

      setAuthComplete(true);

      toast({
        title: "Registration Successful",
        description: "Welcome to DexMail!",
      });

      // Redirect after short delay
      setTimeout(() => {
        router.push('/dashboard');
      }, 1500);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Registration failed';
      setError(errorMessage);
      toast({
        title: "Registration Failed",
        description: errorMessage,
        variant: "destructive",
      });
    }
  };

  const handleTraditionalRegistration = async () => {
    if (!name.trim() || !password.trim() || !confirmPassword.trim()) {
      setError('Please fill in all fields');
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setIsLoading(true);
    setError('');

    const constructedEmail = `${name}@${process.env.NEXT_PUBLIC_DOMAIN}`;

    try {
      await register(constructedEmail, password, 'traditional');

      toast({
        title: "Registration Successful",
        description: "Welcome to DexMail!",
      });

      router.push('/dashboard');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Registration failed';
      setError(errorMessage);
      toast({
        title: "Registration Failed",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const resetWalletConnection = () => {
    disconnect();
    setAuthComplete(false);
    setGeneratedEmail('');
    setEmail('');
    setError('');
  };

  return (
    <div className="text-center space-y-8">
      {/* Illustration */}
      <div className="relative h-64 w-full">
        <Image
          src="/illustrations/register.svg"
          alt="Create DexMail Account"
          width={320}
          height={320}
          className="w-full h-full object-contain"
          priority
        />
      </div>

      {/* Content */}
      <div className="space-y-4">
        <h1 className="text-2xl font-bold text-slate-900 leading-tight">
          Create Your Account
        </h1>
        <p className="text-slate-600 leading-relaxed px-4">
          Join DexMail to send emails with crypto transfers and manage your digital assets.
        </p>
      </div>

      {/* Registration Form */}
      <div className="space-y-6">
        {/* Wallet Registration Option */}
        <div className="flex items-center space-x-3 justify-start px-1">
          <Checkbox
            id="use-wallet"
            checked={useWalletAuth}
            onCheckedChange={(checked) => {
              setUseWalletAuth(checked as boolean);
              if (!checked) {
                resetWalletConnection();
              }
              setError('');
            }}
          />
          <Label htmlFor="use-wallet" className="text-sm font-medium text-slate-700">
            Register with wallet and auto-generate email from basename
          </Label>
        </div>

        {/* Error Message */}
        {error && (
          <div className="flex items-center space-x-2 text-red-600 bg-red-50 p-3 rounded-lg">
            <AlertCircle className="h-4 w-4" />
            <span className="text-sm">{error}</span>
          </div>
        )}

        <div className="space-y-4">
          {!useWalletAuth ? (
            // Traditional Registration - DISABLED/COMING SOON
            <div className="p-4 bg-slate-100 rounded-xl border border-slate-200 text-center">
              <p className="text-sm font-medium text-slate-600">
                Coming soon feature under development
              </p>
              {/*
              <div className="text-left space-y-2">
                <Label htmlFor="name" className="text-slate-700 font-medium">
                  Full Name
                </Label>
                <Input
                  id="name"
                  type="text"
                  placeholder="Enter your full name"
                  className="h-12 bg-white border-slate-200 rounded-xl focus:border-slate-400 focus:ring-slate-400"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>

              <div className="text-left space-y-2">
                <Label htmlFor="email" className="text-slate-700 font-medium">
                  Email
                </Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="Enter your email"
                  className="h-12 bg-white border-slate-200 rounded-xl focus:border-slate-400 focus:ring-slate-400"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>

              <div className="text-left space-y-2">
                <Label htmlFor="password" className="text-slate-700 font-medium">
                  Password
                </Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="Create a password"
                  className="h-12 bg-white border-slate-200 rounded-xl focus:border-slate-400 focus:ring-slate-400"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>

              <div className="text-left space-y-2">
                <Label htmlFor="confirm-password" className="text-slate-700 font-medium">
                  Confirm Password
                </Label>
                <Input
                  id="confirm-password"
                  type="password"
                  placeholder="Confirm your password"
                  className="h-12 bg-white border-slate-200 rounded-xl focus:border-slate-400 focus:ring-slate-400"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                />
              </div>
              */}
            </div>
          ) : (
            // Wallet Registration
            <div className="space-y-4">
              {!isConnected ? (
                // Wallet Connection
                <div className="text-center space-y-3">
                  <div className="p-6 bg-slate-50 rounded-2xl">
                    <Wallet className="mx-auto h-12 w-12 text-slate-400 mb-4" />
                    <p className="text-sm font-medium text-slate-600 mb-4">
                      Connect your wallet to continue
                    </p>
                    <ConnectButton.Custom>
                      {({
                        account,
                        chain,
                        openAccountModal,
                        openChainModal,
                        openConnectModal,
                        authenticationStatus,
                        mounted,
                      }) => {
                        const ready = mounted && authenticationStatus !== 'loading';
                        const connected =
                          ready &&
                          account &&
                          chain &&
                          (!authenticationStatus ||
                            authenticationStatus === 'authenticated');

                        return (
                          <Button
                            onClick={connected ? openAccountModal : openConnectModal}
                            disabled={!ready}
                            className="w-full h-12 bg-brand-blue hover:bg-brand-blue-hover text-white font-semibold rounded-full"
                          >
                            {!ready ? (
                              <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Loading...
                              </>
                            ) : connected ? (
                              'Wallet Connected'
                            ) : (
                              'Connect Wallet'
                            )}
                          </Button>
                        );
                      }}
                    </ConnectButton.Custom>
                  </div>
                </div>
              ) : !authComplete ? (
                // Basename fetching and email generation
                <div className="space-y-4">
                  <div className="text-center space-y-3">
                    <div className="p-6 bg-brand-blue/10 rounded-2xl">
                      <CheckCircle className="mx-auto h-8 w-8 text-brand-blue mb-3" />
                      <p className="text-sm font-medium text-slate-900 mb-2">
                        Wallet Connected
                      </p>
                      <p className="text-xs text-slate-600 mb-4">
                        Address: {address?.slice(0, 6)}...{address?.slice(-4)}
                      </p>

                      {isFetchingBasename ? (
                        <div className="space-y-2">
                          <Loader2 className="mx-auto h-6 w-6 text-brand-blue animate-spin" />
                          <p className="text-xs text-slate-600">Fetching basename...</p>
                        </div>
                      ) : basename ? (
                        <div className="space-y-3">
                          <div className="bg-slate-100 p-3 rounded-lg">
                            <p className="text-xs text-slate-500 mb-1">Found basename:</p>
                            <p className="text-sm font-mono font-semibold text-slate-900">{basename}</p>
                            <p className="text-xs text-slate-500 mt-1">Generated email:</p>
                            <p className="text-sm font-mono font-semibold text-brand-blue">{generatedEmail}</p>
                          </div>
                        </div>
                      ) : (
                        <p className="text-xs text-amber-600">No basename found for this wallet</p>
                      )}
                    </div>
                  </div>

                  {/* Email field (editable) */}
                  <div className="text-left space-y-2">
                    <Label htmlFor="wallet-email" className="text-slate-700 font-medium">
                      Email Address {generatedEmail && '(auto-generated, editable)'}
                    </Label>
                    <Input
                      id="wallet-email"
                      type="email"
                      placeholder="Enter your email or edit the generated one"
                      className="h-12 bg-white border-slate-200 rounded-xl focus:border-slate-400 focus:ring-slate-400 text-slate-900 placeholder:text-slate-500"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                    />
                  </div>

                  <Button
                    onClick={handleWalletRegistration}
                    disabled={isSigning || isAuthenticating || !email.trim()}
                    className="w-full h-12 bg-brand-blue hover:bg-brand-blue-hover text-white font-semibold rounded-full"
                  >
                    {isSigning ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Signing...
                      </>
                    ) : isAuthenticating ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Creating Account...
                      </>
                    ) : (
                      'Sign to Create Account'
                    )}
                  </Button>
                  {!email.trim() && (
                    <p className="text-xs text-amber-600">Please enter an email address</p>
                  )}
                </div>
              ) : (
                // Registration Complete
                <div className="text-center space-y-4">
                  <div className="p-6 bg-brand-blue/10 rounded-2xl">
                    <CheckCircle className="mx-auto h-12 w-12 text-brand-blue mb-4" />
                    <p className="text-sm font-medium text-slate-900 mb-2">
                      Account Created Successfully!
                    </p>
                    <p className="text-xs text-slate-600 mb-3">
                      Registered with wallet signature
                    </p>
                    <div className="bg-slate-100 p-2 rounded-lg space-y-1">
                      <p className="text-xs text-slate-500">
                        Email: <span className="font-mono">{email}</span>
                      </p>
                      <p className="text-xs text-slate-500">
                        Wallet: <span className="font-mono">{address?.slice(0, 6)}...{address?.slice(-4)}</span>
                      </p>
                      {basename && (
                        <p className="text-xs text-slate-500">
                          Basename: <span className="font-mono">{basename}</span>
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Create Account Button (for traditional registration only) - HIDDEN/COMMENTED 
        {!useWalletAuth && (
          <div className="space-y-4">
            <Button
              onClick={handleTraditionalRegistration}
              disabled={isLoading}
              className="w-full h-12 bg-brand-blue hover:bg-brand-blue-hover text-white font-semibold rounded-full"
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating Account...
                </>
              ) : (
                'Create Account'
              )}
            </Button>

            <div className="text-sm text-slate-600">
              Already have an account?{" "}
              <Link href="/login" className="text-brand-blue hover:text-brand-blue-hover font-medium">
                Sign in
              </Link>
            </div>
          </div>
        )}
        */}

        {/* Sign in link for wallet users */}
        {useWalletAuth && !authComplete && (
          <div className="text-sm text-slate-600">
            Already have an account?{" "}
            <Link href="/login" className="text-brand-blue hover:text-brand-blue-hover font-medium">
              Sign in with wallet
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}