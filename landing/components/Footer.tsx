"use client";

import { motion } from "framer-motion";
import { Mail, Twitter, Instagram, Github } from "lucide-react";
import Link from "next/link";

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="py-16 px-6 bg-taskmelt-black text-white">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-12">
          {/* Brand */}
          <div className="md:col-span-2">
            <motion.h3
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              transition={{ duration: 0.6 }}
              viewport={{ once: true }}
              className="text-4xl font-black mb-4"
            >
              taskmelt
            </motion.h3>
            <p className="text-lg text-gray-400 mb-6">
              Chaos in. Clarity out.
            </p>
            <p className="text-gray-400 max-w-md">
              Transform your mental chaos into organized tasks with AI-powered
              brain dumping and intelligent scheduling.
            </p>
          </div>

          {/* Product */}
          <div>
            <h4 className="text-xl font-bold mb-4">Product</h4>
            <ul className="space-y-3">
              <li>
                <Link
                  href="/#features"
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  Features
                </Link>
              </li>
              <li>
                <Link
                  href="/pricing"
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  Pricing
                </Link>
              </li>
              <li>
                <Link
                  href="/#download"
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  Download
                </Link>
              </li>
              <li>
                <Link
                  href="/blog"
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  Blog
                </Link>
              </li>
            </ul>
          </div>

          {/* Company */}
          <div>
            <h4 className="text-xl font-bold mb-4">Company</h4>
            <ul className="space-y-3">
              <li>
                <Link
                  href="/about"
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  About
                </Link>
              </li>
              <li>
                <Link
                  href="/support"
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  Support
                </Link>
              </li>
              <li>
                <Link
                  href="/privacy"
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link
                  href="/terms"
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  Terms of Service
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Social Links */}
        <div className="flex justify-center gap-6 mb-12">
          <motion.a
            href="mailto:hello@taskmelt.com"
            whileHover={{ scale: 1.1 }}
            className="p-3 bg-white bg-opacity-10 rounded-full hover:bg-opacity-20 transition-colors"
            aria-label="Email"
          >
            <Mail className="w-6 h-6" />
          </motion.a>
          <motion.a
            href="#twitter"
            whileHover={{ scale: 1.1 }}
            className="p-3 bg-white bg-opacity-10 rounded-full hover:bg-opacity-20 transition-colors"
            aria-label="Twitter"
          >
            <Twitter className="w-6 h-6" />
          </motion.a>
          <motion.a
            href="#instagram"
            whileHover={{ scale: 1.1 }}
            className="p-3 bg-white bg-opacity-10 rounded-full hover:bg-opacity-20 transition-colors"
            aria-label="Instagram"
          >
            <Instagram className="w-6 h-6" />
          </motion.a>
          <motion.a
            href="https://github.com/arthi-arumugam99/rork-taskmelt"
            whileHover={{ scale: 1.1 }}
            className="p-3 bg-white bg-opacity-10 rounded-full hover:bg-opacity-20 transition-colors"
            aria-label="GitHub"
            target="_blank"
            rel="noopener noreferrer"
          >
            <Github className="w-6 h-6" />
          </motion.a>
        </div>

        {/* Copyright */}
        <div className="text-center text-gray-400 border-t border-gray-800 pt-8">
          <p>© {currentYear} taskmelt. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}
