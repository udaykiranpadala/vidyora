import { useRef, useEffect, useState } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useGSAP } from '@gsap/react';

gsap.registerPlugin(ScrollTrigger, useGSAP);

const SplitText = ({
  text = '',
  className = '',
  style = {},
  delay = 50,
  duration = 1.25,
  ease = 'power3.out',
  splitType = 'chars',
  from = { opacity: 0, y: 40 },
  to = { opacity: 1, y: 0 },
  threshold = 0.1,
  rootMargin = '-100px',
  textAlign = 'center',
  tag = 'p',
  onLetterAnimationComplete
}) => {
  const ref = useRef(null);
  const animationCompletedRef = useRef(false);
  const onCompleteRef = useRef(onLetterAnimationComplete);
  const [fontsLoaded, setFontsLoaded] = useState(false);

  // Keep callback ref updated
  useEffect(() => {
    onCompleteRef.current = onLetterAnimationComplete;
  }, [onLetterAnimationComplete]);

  useEffect(() => {
    if (document.fonts.status === 'loaded') {
      setFontsLoaded(true);
    } else {
      document.fonts.ready.then(() => {
        setFontsLoaded(true);
      });
    }
  }, []);

  useGSAP(
    () => {
      if (!ref.current || !text || !fontsLoaded) return;
      if (animationCompletedRef.current) return;
      const el = ref.current;

      const startPct = (1 - threshold) * 100;
      const marginMatch = /^(-?\d+(?:\.\d+)?)(px|em|rem|%)?$/.exec(rootMargin);
      const marginValue = marginMatch ? parseFloat(marginMatch[1]) : 0;
      const marginUnit = marginMatch ? marginMatch[2] || 'px' : 'px';
      const sign =
        marginValue === 0
          ? ''
          : marginValue < 0
            ? `-=${Math.abs(marginValue)}${marginUnit}`
            : `+=${marginValue}${marginUnit}`;
      const start = `top ${startPct}%${sign}`;

      let targets = [];
      if (splitType.includes('chars')) {
        targets = el.querySelectorAll('.split-char');
      } else if (splitType.includes('words')) {
        targets = el.querySelectorAll('.split-word');
      } else {
        targets = el.querySelectorAll('.split-char, .split-word');
      }

      if (!targets.length) return;

      const tween = gsap.fromTo(
        targets,
        { ...from },
        {
          ...to,
          duration,
          ease,
          stagger: delay / 1000,
          scrollTrigger: {
            trigger: el,
            start,
            once: true,
            fastScrollEnd: true,
            anticipatePin: 0.4
          },
          onComplete: () => {
            animationCompletedRef.current = true;
            onCompleteRef.current?.();
          },
          willChange: 'transform, opacity',
          force3D: true
        }
      );

      return () => {
        ScrollTrigger.getAll().forEach(st => {
          if (st.trigger === el) st.kill();
        });
        tween.kill();
      };
    },
    {
      dependencies: [
        text,
        delay,
        duration,
        ease,
        splitType,
        JSON.stringify(from),
        JSON.stringify(to),
        threshold,
        rootMargin,
        fontsLoaded
      ],
      scope: ref
    }
  );

  const renderContent = () => {
    if (!text) return null;
    const words = text.split(' ');

    return words.map((word, wordIndex) => {
      const isLastWord = wordIndex === words.length - 1;

      if (splitType.includes('chars')) {
        const chars = Array.from(word);
        return (
          <span
            key={wordIndex}
            className="split-word"
            style={{ display: 'inline-block', whiteSpace: 'nowrap' }}
          >
            {chars.map((char, charIndex) => (
              <span
                key={charIndex}
                className="split-char"
                style={{ display: 'inline-block', willChange: 'transform, opacity' }}
              >
                {char}
              </span>
            ))}
            {!isLastWord && <span style={{ display: 'inline-block' }}>&nbsp;</span>}
          </span>
        );
      }

      return (
        <span
          key={wordIndex}
          className="split-word"
          style={{ display: 'inline-block', willChange: 'transform, opacity' }}
        >
          {word}
          {!isLastWord && <span>&nbsp;</span>}
        </span>
      );
    });
  };

  const combinedStyle = {
    textAlign,
    overflow: 'hidden',
    display: 'inline-block',
    whiteSpace: 'normal',
    wordWrap: 'break-word',
    willChange: 'transform, opacity',
    ...style
  };
  const classes = `split-parent ${className}`;
  const Tag = tag || 'p';

  return (
    <Tag ref={ref} style={combinedStyle} className={classes}>
      {renderContent()}
    </Tag>
  );
};

export default SplitText;
