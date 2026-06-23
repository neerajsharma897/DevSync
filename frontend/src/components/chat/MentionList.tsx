import { forwardRef, useEffect, useImperativeHandle, useState } from 'react';

const MentionList = forwardRef((props: any, ref) => {
  const [selectedIndex, setSelectedIndex] = useState(0);

  const selectItem = (index: number) => {
    const item = props.items[index];

    if (item) {
      props.command({ id: item.id, label: item.label });
    }
  };

  const upHandler = () => {
    setSelectedIndex((selectedIndex + props.items.length - 1) % props.items.length);
  };

  const downHandler = () => {
    setSelectedIndex((selectedIndex + 1) % props.items.length);
  };

  const enterHandler = () => {
    selectItem(selectedIndex);
  };

  useEffect(() => setSelectedIndex(0), [props.items]);

  useImperativeHandle(ref, () => ({
    onKeyDown: ({ event }: { event: KeyboardEvent }) => {
      if (event.key === 'ArrowUp') {
        upHandler();
        return true;
      }

      if (event.key === 'ArrowDown') {
        downHandler();
        return true;
      }

      if (event.key === 'Enter') {
        enterHandler();
        return true;
      }

      return false;
    },
  }));

  if (!props.items || props.items.length === 0) {
    return (
      <div className="bg-gray-900 border border-gray-800 rounded-lg shadow-xl p-2 text-sm text-gray-500">
        No results
      </div>
    );
  }

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-lg shadow-xl overflow-y-auto max-h-60 py-1 min-w-[150px]">
      {props.items.map((item: any, index: number) => (
        <button
          className={`w-full text-left px-4 py-2 text-sm transition-colors ${
            index === selectedIndex ? 'bg-gray-800 text-white' : 'text-gray-300 hover:bg-gray-800/50'
          }`}
          key={index}
          onClick={() => selectItem(index)}
        >
          {item.label}
        </button>
      ))}
    </div>
  );
});

MentionList.displayName = 'MentionList';

export default MentionList;
