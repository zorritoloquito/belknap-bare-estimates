import Image from 'next/image';
import Link from 'next/link';
import { companyDetails } from '@/lib/config';

export default function Header() {
  return (
    <header className="py-4 px-6 bg-gray-100 dark:bg-gray-800 shadow-md">
      <div className="container mx-auto flex items-center justify-between">
        <Link href="/" className="flex items-center space-x-3">
          <Image
            src={companyDetails.logoPath}
            alt={`${companyDetails.name} Logo`}
            width={150} // Adjust width as needed, e.g. from image dimensions
            height={50} // Adjust height as needed, e.g. from image dimensions
            priority
          />
          <span className="text-xl font-semibold text-gray-700 dark:text-gray-200">
            {companyDetails.name}
          </span>
        </Link>
        {/* Navigation or other header elements can go here */}
      </div>
    </header>
  );
} 