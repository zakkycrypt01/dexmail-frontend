'use client';

import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
} from '@/components/ui/accordion';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Search, Mail, MessageSquare, FileText, ExternalLink } from 'lucide-react';

export default function HelpCenterPage() {
    return (
        <div className="flex-1 space-y-6 p-8 pt-6">
            <div className="flex flex-col space-y-2">
                <h2 className="text-3xl font-bold tracking-tight">Help Center</h2>
                <p className="text-muted-foreground">
                    Find answers to your questions and learn how to get the most out of DexMail.
                </p>
            </div>

            <div className="relative max-w-xl">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input placeholder="Search for help articles..." className="pl-10 h-10" />
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-base">
                            <Mail className="h-5 w-5" />
                            Contact Support
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-sm text-muted-foreground mb-4">
                            Need help with a specific issue? Our support team is here to assist you.
                        </p>
                        <Button variant="outline" className="w-full" asChild>
                            <a href="mailto:dexmailer.app@gmail.com">Email Support</a>
                        </Button>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-base">
                            <MessageSquare className="h-5 w-5" />
                            Feature Request
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-sm text-muted-foreground mb-4">
                            Have an idea for DexMail? We'd love to hear your feedback.
                        </p>
                        <Button variant="outline" className="w-full">
                            Request a Feature
                        </Button>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-base">
                            <FileText className="h-5 w-5" />
                            Documentation
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-sm text-muted-foreground mb-4">
                            Read our detailed documentation for developers and power users.
                        </p>
                        <Button variant="outline" className="w-full" disabled>
                            View Docs <ExternalLink className="ml-2 h-4 w-4" />
                        </Button>
                    </CardContent>
                </Card>
            </div>

            <div className="space-y-4">
                <h3 className="text-xl font-semibold">Frequently Asked Questions</h3>
                <Accordion type="single" collapsible className="w-full max-w-3xl">
                    <AccordionItem value="item-1">
                        <AccordionTrigger>How do I send crypto with an email?</AccordionTrigger>
                        <AccordionContent>
                            Compose a new message and click the "Attach Crypto Assets" checkbox. You can select ETH, ERC-20 tokens, or NFTs. For DexMail users, the transfer is direct. For non-users, a secure claim code is generated.
                        </AccordionContent>
                    </AccordionItem>

                    <AccordionItem value="item-2">
                        <AccordionTrigger>Why do some emails come from "no-reply@dexmail.app"?</AccordionTrigger>
                        <AccordionContent>
                            If you send from an external address (e.g., Gmail), we use "no-reply@dexmail.app" to ensure delivery and DMARC compliance. Your name implies the sender, and replies go to you. DexMail addresses send directly.
                        </AccordionContent>
                    </AccordionItem>

                    <AccordionItem value="item-3">
                        <AccordionTrigger>Is my data decentralized?</AccordionTrigger>
                        <AccordionContent>
                            Yes! Content is stored on IPFS for censorship resistance. Metadata is indexed by our smart contracts.
                        </AccordionContent>
                    </AccordionItem>

                    <AccordionItem value="item-4">
                        <AccordionTrigger>How do I claim a crypto transfer?</AccordionTrigger>
                        <AccordionContent>
                            Click the claim link in the email or enter the code on the claim page. Connect your wallet to receive assets. Registered users receive transfers automatically.
                        </AccordionContent>
                    </AccordionItem>

                    <AccordionItem value="item-5">
                        <AccordionTrigger>What network is supported?</AccordionTrigger>
                        <AccordionContent>
                            We operate on Base Sepolia testnet, with plans for Mainnet.
                        </AccordionContent>
                    </AccordionItem>
                </Accordion>
            </div>
        </div>
    );
}
