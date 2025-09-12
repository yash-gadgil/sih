'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import React from 'react'

const navItems = [
    { href: '/', label: 'Home' },
    { href: '/upload', label: 'Upload CV' },
    { href: '/search', label: 'Search' },
]

export default function Navbar() {
    const pathname = usePathname()

    return (
        <nav className="sticky top-0 z-50 bg-white shadow-navbar">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex h-16 items-center justify-between">
                    <div className="flex items-center">
                        <Link href="/" className="text-text font-semibold text-lg">
                            PM Internship
                        </Link>
                    </div>
                    <div className="hidden md:flex space-x-6">
                        {navItems.map((item) => {
                            const isActive = pathname === item.href
                            return (
                                <Link
                                    key={item.href}
                                    href={item.href}
                                    className={`text-sm font-medium px-2 py-1.5 rounded-md transition-colors ${isActive
                                            ? 'text-primary bg-primary/10'
                                            : 'text-gray-600 hover:text-text hover:bg-gray-50'
                                        }`}
                                >
                                    {item.label}
                                </Link>
                            )
                        })}
                    </div>
                    <div className="md:hidden">
                        {/* Placeholder for mobile menu trigger */}
                    </div>
                </div>
            </div>
        </nav>
    )
}


