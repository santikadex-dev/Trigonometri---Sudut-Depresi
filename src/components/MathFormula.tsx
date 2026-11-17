import React, { useMemo } from 'react';
import katex from 'katex';
import 'katex/dist/katex.min.css';

interface MathFormulaProps {
  tex: string;
  block?: boolean;
  className?: string;
}

export const MathFormula: React.FC<MathFormulaProps> = ({
  tex,
  block = false,
  className = '',
}) => {
  const html = useMemo(() => {
    return katex.renderToString(tex, {
      displayMode: block,
      throwOnError: false,
      strict: false,
    });
  }, [tex, block]);

  if (block) {
    return (
      <div
        className={`overflow-x-auto py-1 ${className}`}
        dangerouslySetInnerHTML={{ __html: html }}
      />
    );
  }

  return (
    <span
      className={`inline-block align-baseline ${className}`}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
};
