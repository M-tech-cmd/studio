
'use client';

type PageHeaderProps = {
  title: string;
  subtitle: string;
  titleColor?: string;
  subtitleColor?: string;
};

export function PageHeader({ title, subtitle, titleColor, subtitleColor }: PageHeaderProps) {
  // Robust fallbacks to original Cathedral palette
  const finalTitleColor = titleColor && titleColor.trim() !== '' ? titleColor : '#1e3a5f';
  const finalSubtitleColor = subtitleColor && subtitleColor.trim() !== '' ? subtitleColor : '#4b5563';

  return (
    <section className="py-8 md:py-12 bg-transparent isolate">
      <div className="container max-w-7xl mx-auto px-4 text-center">
        <h1 
          className="text-3xl md:text-4xl lg:text-5xl font-headline font-bold tracking-tight"
          style={{ color: finalTitleColor }}
        >
          {title}
        </h1>
        <p 
          className="mt-4 text-base md:text-lg max-w-2xl mx-auto font-medium leading-relaxed"
          style={{ color: finalSubtitleColor }}
        >
          {subtitle}
        </p>
      </div>
    </section>
  );
}
