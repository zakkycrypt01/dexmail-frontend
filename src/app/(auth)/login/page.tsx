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
import { useAuth } from "@/contexts/auth-context";
import { useToast } from "@/hooks/use-toast";
import { authService } from "@/lib/auth-service";

export default function LoginPage() {
  const router = useRouter();
  const { toast } = useToast();
  const { login, loginWithWallet } = useAuth();
  const {
    address,
    isConnected,
    isConnecting,
    isSigning,
    isAuthenticating,
    connectWallet,
    disconnect,
    signMessage
  } = useWallet();

  const [useWalletAuth, setUseWalletAuth] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [authComplete, setAuthComplete] = useState(false);
  const [error, setError] = useState('');

  const handleWalletConnect = async () => {
    try {
      setError('');
      await connectWallet();
    } catch (error) {
      setError('Failed to connect wallet');
      toast({
        title: "Connection Failed",
        description: "Failed to connect wallet. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleWalletAuth = async () => {
    if (!email.trim()) {
      setError('Please enter your email address');
      return;
    }

    if (!isConnected || !address) {
      setError('Please connect your wallet first');
      return;
    }

    try {
      setError('');

      // Get challenge from auth service
      const challenge = await authService.getChallenge(email);

      // Sign the challenge
      const signature = await signMessage(challenge.nonce);

      // Login with wallet using auth context
      await loginWithWallet(email, address, signature);

      setAuthComplete(true);

      toast({
        title: "Login Successful",
        description: "Welcome back to DexMail!",
      });

      // Redirect after short delay
      setTimeout(() => {
        router.push('/dashboard');
      }, 1500);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Authentication failed';
      setError(errorMessage);
      toast({
        title: "Authentication Failed",
        description: errorMessage,
        variant: "destructive",
      });
    }
  };

  const handleTraditionalLogin = async () => {
    if (!email.trim() || !password.trim()) {
      setError('Please enter both email and password');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      await login(email, password, undefined, 'traditional');

      toast({
        title: "Login Successful",
        description: "Welcome back to DexMail!",
      });

      router.push('/dashboard');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Login failed';
      setError(errorMessage);
      toast({
        title: "Login Failed",
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
    setError('');
  };

  return (
    <div className="text-center space-y-8">
      {/* Illustration */}
      <div className="relative h-64 w-full">
        <Image
          src="/illustrations/login.svg"
          alt="Login to DexMail"
          width={320}
          height={320}
          className="w-full h-full object-contain"
          priority
        />
      </div>

      {/* Content */}
      <div className="space-y-4">
        <h1 className="text-2xl font-bold text-slate-900 leading-tight">
          Welcome Back
        </h1>
        <p className="text-slate-600 leading-relaxed px-4">
          Sign in to access your secure email and crypto features.
        </p>
      </div>

      {/* Login Form */}
      <div className="space-y-6">
        {/* Wallet Connection Option */}
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
            Sign in with wallet signature instead of password
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
          {/* Email field - always shown */}
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

          {!useWalletAuth ? (
            // Traditional Password Login - DISABLED/COMING SOON
            <div className="p-4 bg-slate-100 rounded-xl border border-slate-200 text-center">
              <p className="text-sm font-medium text-slate-600">
                Coming soon feature under development
              </p>
              {/* 
              <div className="text-left space-y-2 mt-4 opacity-50 pointer-events-none">
                <Label htmlFor="password" className="text-slate-700 font-medium">
                  Password
                </Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="Enter your password"
                  className="h-12 bg-white border-slate-200 rounded-xl focus:border-slate-400 focus:ring-slate-400"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
              */}
            </div>
          ) : (
            // Wallet Signature Authentication
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
                // Signature Authentication
                <div className="text-center space-y-3">
                  <div className="p-6 bg-brand-blue/10 rounded-2xl">
                    <CheckCircle className="mx-auto h-8 w-8 text-brand-blue mb-3" />
                    <p className="text-sm font-medium text-slate-900 mb-2">
                      Wallet Connected
                    </p>
                    <p className="text-xs text-slate-600 mb-4">
                      Address: {address?.slice(0, 6)}...{address?.slice(-4)}
                    </p>
                    <Button
                      onClick={handleWalletAuth}
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
                          Signing In...
                        </>
                      ) : (
                        'Sign to Login'
                      )}
                    </Button>
                    {!email.trim() && (
                      <p className="text-xs text-amber-600 mt-2">Please enter your email address first</p>
                    )}
                  </div>
                </div>
              ) : (
                // Authentication Complete
                <div className="text-center space-y-4">
                  <div className="p-6 bg-brand-blue/10 rounded-2xl">
                    <CheckCircle className="mx-auto h-12 w-12 text-brand-blue mb-4" />
                    <p className="text-sm font-medium text-slate-900 mb-2">
                      Signed In Successfully!
                    </p>
                    <p className="text-xs text-slate-600 mb-3">
                      Authenticated with wallet signature
                    </p>
                    <div className="bg-slate-100 p-2 rounded-lg space-y-1">
                      <p className="text-xs text-slate-500">
                        Email: <span className="font-mono">{email}</span>
                      </p>
                      <p className="text-xs text-slate-500">
                        Wallet: <span className="font-mono">{address?.slice(0, 6)}...{address?.slice(-4)}</span>
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Sign In Button (for traditional login only) - HIDDEN/COMMENTED 
        {!useWalletAuth && (
          <div className="space-y-4">
            <Button
              onClick={handleTraditionalLogin}
              disabled={isLoading}
              className="w-full h-12 bg-brand-blue hover:bg-brand-blue-hover text-white font-semibold rounded-full"
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Signing In...
                </>
              ) : (
                'Sign In'
              )}
            </Button>

            <div className="text-sm text-slate-600">
              Don&apos;t have an account?{" "}
              <Link href="/register" className="text-brand-blue hover:text-brand-blue-hover font-medium">
                Sign up
              </Link>
            </div>
          </div>
        )}
        */}

        {/* Sign up link for wallet users */}
        {!useWalletAuth && !authComplete && (
          <div className="text-sm text-slate-600">
            Don&apos;t have an account?{" "}
            <Link href="/register" className="text-brand-blue hover:text-brand-blue-hover font-medium">
              Sign up with wallet
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}