import { ReactNode } from "react";
import { useScrollAnimation, scrollAnimationClasses } from "@/hooks/useScrollAnimation";

type AnimationType = "fadeUp" | "fadeIn" | "scaleIn" | "slideInLeft" | "slideInRight";

interface ScrollRevealProps {
  children: ReactNode;
  animation?: AnimationType;
  delay?: number;
  className?: string;
  threshold?: number;
}

/**
 * A wrapper component that reveals children with scroll-triggered animations.
 * Uses IntersectionObserver for performance.
 */
export const ScrollReveal = ({
  children,
  animation = "fadeUp",
  delay = 0,
  className = "",
  threshold = 0.1,
}: ScrollRevealProps) => {
  const { ref, isVisible } = useScrollAnimation({ threshold });

  const animationClass = scrollAnimationClasses[animation](isVisible);

  return (
    <div
      ref={ref}
      className={`${animationClass} ${className}`}
      style={{ transitionDelay: isVisible ? `${delay}ms` : "0ms" }}
    >
      {children}
    </div>
  );
};

/**
 * Stagger children animations with incremental delays
 */
interface StaggerChildrenProps {
  children: ReactNode[];
  baseDelay?: number;
  staggerDelay?: number;
  animation?: AnimationType;
  className?: string;
  childClassName?: string;
}

export const StaggerChildren = ({
  children,
  baseDelay = 0,
  staggerDelay = 100,
  animation = "fadeUp",
  className = "",
  childClassName = "",
}: StaggerChildrenProps) => {
  const { ref, isVisible } = useScrollAnimation({ threshold: 0.1 });

  return (
    <div ref={ref} className={className}>
      {children.map((child, index) => (
        <div
          key={index}
          className={`${scrollAnimationClasses[animation](isVisible)} ${childClassName}`}
          style={{
            transitionDelay: isVisible ? `${baseDelay + index * staggerDelay}ms` : "0ms",
          }}
        >
          {child}
        </div>
      ))}
    </div>
  );
};

export default ScrollReveal;
