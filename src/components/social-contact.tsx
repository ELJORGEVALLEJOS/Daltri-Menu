import { ExternalLink, Facebook, Globe, Instagram, LayoutGrid } from 'lucide-react';

export type MerchantSocialLinks = {
    uber_eats?: string;
    google?: string;
    instagram?: string;
    facebook?: string;
    tiktok?: string;
};

type SocialKey = keyof MerchantSocialLinks;

const SOCIAL_CONFIG: Array<{ key: SocialKey; name: string; icon: typeof LayoutGrid }> = [
    { key: 'uber_eats', name: 'Uber Eats', icon: LayoutGrid },
    { key: 'google', name: 'Google', icon: Globe },
    { key: 'instagram', name: 'Instagram', icon: Instagram },
    { key: 'facebook', name: 'Facebook', icon: Facebook },
    { key: 'tiktok', name: 'TikTok', icon: LayoutGrid },
];

function isExternalHttpUrl(value: string) {
    try {
        const parsed = new URL(value);
        return parsed.protocol === 'http:' || parsed.protocol === 'https:';
    } catch {
        return false;
    }
}

export function SocialLinks({ links }: { links?: MerchantSocialLinks | null }) {
    const socials = SOCIAL_CONFIG
        .map((entry) => ({
            ...entry,
            href: links?.[entry.key]?.trim() || '',
        }))
        .filter((entry) => isExternalHttpUrl(entry.href));

    if (socials.length === 0) {
        return null;
    }

    return (
        <div className="mb-12">
            <h3 className="text-2xl font-sans font-bold mb-6 text-gray-800 tracking-tight px-2">
                Nuestras redes sociales
            </h3>
            <div className="space-y-4">
                {socials.map((social) => (
                    <a
                        key={social.key}
                        href={social.href}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center justify-between p-5 bg-white rounded-2xl shadow-premium border border-gray-100/50 hover:scale-[1.01] transition-all active:scale-[0.99]"
                    >
                        <div className="flex items-center gap-5">
                            <div className="bg-gray-50 p-3 rounded-2xl border border-gray-100">
                                <social.icon className="w-7 h-7 text-gray-800" />
                            </div>
                            <span className="font-bold text-gray-800 text-lg">{social.name}</span>
                        </div>
                        <ExternalLink className="w-6 h-6 text-gray-400 mr-2" />
                    </a>
                ))}
            </div>
        </div>
    );
}
