import { useEffect, useRef, useState } from "react";
import { useParallax } from "@/hooks/useParallax";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const faqs = [
  {
    question: "What is Buoyancis?",
    answer:
      "Buoyancis is a theory of structure in motion—exploring how trust accumulates, order persists, and systems evolve under pressure. We examine the invisible architecture that holds institutions, communities, and relationships together.",
  },
  {
    question: "What does 'structure in motion' mean?",
    answer:
      "Structure isn't static—it's constantly being tested and reshaped. We explore how stable patterns emerge, how trust compounds or erodes, and what conditions allow systems to adapt rather than collapse.",
  },
  {
    question: "Who is this work for?",
    answer:
      "Anyone curious about why some systems endure while others fail. Whether you're examining organizations, markets, or communities—the principles apply. This is for those who value depth over speed.",
  },
  {
    question: "How is this different from other approaches?",
    answer:
      "Most frameworks optimize for simplicity or quick answers. We prioritize depth and accuracy. The goal is to understand how systems actually work—not to offer easy formulas, but to build genuine insight over time.",
  },
  {
    question: "How can I engage with the ideas?",
    answer:
      "Start by reading. Observe the systems around you through this lens. As you engage more deeply, you can participate in discussions and contribute your own observations. Understanding grows through genuine inquiry.",
  },
  {
    question: "What will I find here?",
    answer:
      "Essays exploring core concepts, analysis of how these principles manifest in real systems, and ongoing inquiry as the work develops. This is a living project—you're invited to think alongside us.",
  },
  {
    question: "When will new work be published?",
    answer:
      "We publish when there's something meaningful to share. Quality over frequency. Join the newsletter to be notified when new essays and insights are available.",
  },
  {
    question: "Is this free to access?",
    answer:
      "Core essays and the framework overview are freely accessible. Deeper engagement—extended analysis, discussions, and direct dialogue—is available through our participation tiers.",
  },
];

const FAQ = () => {
  const sectionRef = useRef<HTMLElement>(null);
  const [isVisible, setIsVisible] = useState(false);
  const parallaxOffset = useParallax(0.01);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.1 }
    );

    if (sectionRef.current) {
      observer.observe(sectionRef.current);
    }

    return () => observer.disconnect();
  }, []);

  return (
    <section
      id="faq"
      ref={sectionRef}
      className="section-padding bg-cream/30 relative overflow-hidden scroll-mt-20"
    >
      {/* Parallax background layer */}
      <div
        className="absolute inset-0 bg-gradient-to-t from-transparent via-olive-light/5 to-transparent pointer-events-none"
        style={{ transform: `translateY(${parallaxOffset}px)` }}
      />

      <div className="container-narrow relative z-10">
        {/* Section header */}
        <div className="text-center mb-12">
          <h2
            className={`text-3xl md:text-4xl font-serif text-foreground mb-4 transition-all duration-700 ease-out ${
              isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
            }`}
          >
            Common questions
          </h2>
          <p
            className={`text-muted-foreground max-w-lg mx-auto transition-all duration-700 ease-out delay-200 ${
              isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
            }`}
          >
            Answers to questions about the theory and how to engage with it.
          </p>
        </div>

        {/* Accordion */}
        <div
          className={`max-w-2xl mx-auto transition-all duration-700 ease-out delay-300 ${
            isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"
          }`}
        >
          <Accordion type="single" collapsible className="w-full">
            {faqs.map((faq, index) => (
              <AccordionItem
                key={index}
                value={`item-${index}`}
                className="border-border/60"
              >
                <AccordionTrigger className="text-left hover:no-underline hover:text-primary py-5 text-foreground">
                  {faq.question}
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground leading-relaxed pb-5">
                  {faq.answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </div>
    </section>
  );
};

export default FAQ;