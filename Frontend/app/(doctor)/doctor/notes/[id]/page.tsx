'use client';
import { useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';

// Notes are viewed and written from the appointment detail page.
// This route redirects there for any deep-linked note ID.
export default function NoteRedirect() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();

  useEffect(() => {
    router.replace(`/doctor/appointments/${id}`);
  }, [id, router]);

  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="h-8 w-8 border-4 border-brand-200 border-t-brand-600 rounded-full animate-spin" />
    </div>
  );
}
