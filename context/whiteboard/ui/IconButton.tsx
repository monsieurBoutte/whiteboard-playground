import React from 'react';
import cx from 'classnames';

interface IconButtonProps {
  onClick: () => void;
  icon: React.ReactNode;
  shouldHighlight?: boolean;
  label?: string;
}

export const IconButton: React.FC<IconButtonProps> = ({
  onClick,
  icon,
  shouldHighlight = false,
  label
}) => {
  return (
    <button
      onClick={onClick}
      className={cx(
        `px-4 py-2 rounded
        flex gap-1 items-center p-2
        text-slate-500

        shadow-[-5px_-5px_10px_rgba(255,_255,_255,_0.8),_5px_5px_10px_rgba(0,_0,_0,_0.25)]
        dark:shadow-[-5px_-5px_10px_rgba(29,_77,_112,_0.8),_5px_5px_10px_rgba(0,_0,_0,_0.25)]

        transition-all

        hover:text-violet-500
        dark:hover:text-blue-500

        focus:outline-none
        focus:ring-2
        focus:ring-offset-2
        focus:ring-violet-500
        dark:focus:ring-blue-500
        focus:ring-offset-slate-100
        dark:focus:ring-offset-slate-800
        `,
        shouldHighlight &&
          `text-violet-500
          dark:text-blue-500

          ring-1
          ring-violet-500
          dark:ring-blue-500
          ring-offset-1
          ring-offset-slate-100/15
          dark:ring-offset-slate-800`,
        !shouldHighlight &&
          `hover:shadow-[-1px_-1px_5px_rgba(255,_255,_255,_0.6),_1px_1px_5px_rgba(0,_0,_0,_0.3),inset_-2px_-2px_5px_rgba(255,_255,_255,_1),inset_2px_2px_4px_rgba(0,_0,_0,_0.3)]
          hover:dark:shadow-[-1px_-1px_5px_rgba(29,_77,_112,_0.6),_1px_1px_5px_rgba(0,_0,_0,_0.3),inset_-2px_-2px_5px_rgba(29,_77,_112,_1),inset_2px_2px_4px_rgba(0,_0,_0,_0.3)]
          `
      )}
    >
      {icon}
      {label && <span className="hidden md:block">{label}</span>}
    </button>
  );
};
