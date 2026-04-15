import { motion, useInView } from 'framer-motion';
import { useEffect, useRef, useState } from 'react';

function CountUp({ end, duration = 2, decimals = 0, suffix = '', prefix = '' }) {
  const [count, setCount] = useState(0);
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: '-50px' });
  const hasAnimated = useRef(false);

  useEffect(() => {
    if (!isInView || hasAnimated.current) return;
    hasAnimated.current = true;

    const startTime = performance.now();
    const startVal = 0;

    function animate(currentTime) {
      const elapsed = (currentTime - startTime) / 1000;
      const progress = Math.min(elapsed / duration, 1);
      // ease-out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      const current = startVal + (end - startVal) * eased;
      setCount(current);

      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    }

    requestAnimationFrame(animate);
  }, [isInView, end, duration]);

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 20 }}
      animate={isInView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.6 }}
    >
      <span className="text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight text-white">
        {prefix}{decimals > 0 ? count.toFixed(decimals) : Math.round(count)}{suffix}
      </span>
    </motion.div>
  );
}

export default CountUp;
