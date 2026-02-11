import { Facebook, Instagram, Twitter, ExternalLink, MapPin, Phone, Mail, Globe } from 'lucide-react';
import { Button } from './ui/button';

export function SocialLinks() {
    const socials = [
        { name: 'Uber Eats', icon: ExternalLink, href: '#' },
        { name: 'Google', icon: Globe, href: '#' },
        { name: 'Instagram', icon: Instagram, href: '#' },
        { name: 'Facebook', icon: Facebook, href: '#' },
        { name: 'TikTok', icon: ExternalLink, href: '#' },
    ];

    return (
        <div className="bg-white rounded-xl p-6 shadow-sm mb-6">
            <h3 className="text-xl font-bold mb-4 text-gray-800">Nuestras redes sociales</h3>
            <div className="space-y-3">
                {socials.map((social) => (
                    <a
                        key={social.name}
                        href={social.href}
                        className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 transition-colors border border-gray-100"
                    >
                        <div className="flex items-center gap-4">
                            <div className="bg-gray-100 p-2 rounded-lg">
                                <social.icon className="w-6 h-6 text-gray-700" />
                            </div>
                            <span className="font-medium text-gray-700">{social.name}</span>
                        </div>
                        <ExternalLink className="w-5 h-5 text-gray-400" />
                    </a>
                ))}
            </div>
        </div>
    );
}

export function ContactInfo() {
    return (
        <div className="bg-white rounded-xl p-6 shadow-sm mb-20">
            <h3 className="text-xl font-bold mb-4 text-gray-800">Contacto</h3>
            <div className="space-y-4">
                <div className="flex items-center gap-4 p-2">
                    <div className="bg-gray-100 p-3 rounded-full">
                        <Phone className="w-5 h-5 text-gray-600" />
                    </div>
                    <div>
                        <p className="text-sm text-gray-500">Teléfono</p>
                        <p className="font-medium text-gray-800">(123) 555-3000</p>
                    </div>
                </div>
                <div className="flex items-center gap-4 p-2">
                    <div className="bg-gray-100 p-3 rounded-full">
                        <Mail className="w-5 h-5 text-gray-600" />
                    </div>
                    <div>
                        <p className="text-sm text-gray-500">E-mail</p>
                        <p className="font-medium text-gray-800">alex@alexcuisine.com</p>
                    </div>
                </div>
                <div className="flex items-center gap-4 p-2">
                    <div className="bg-gray-100 p-3 rounded-full">
                        <Globe className="w-5 h-5 text-gray-600" />
                    </div>
                    <div>
                        <p className="text-sm text-gray-500">Sitio web</p>
                        <p className="font-medium text-gray-800">www.alexandrecuisine.com</p>
                    </div>
                </div>
            </div>
        </div>
    );
}
