import PropTypes from 'prop-types';
import { useState } from 'react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';

import SortableItem from './SortableItem';

const SortableList = ({ items: initialItems, handleReorder }) => {
  const [items, setItems] = useState(initialItems);
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );
  const handleDragEnd = (event) => {
    const { active, over } = event;

    if (active.id !== over.id) {
      setItems((items) => {
        const oldIndex = items.findIndex(item => item.id === active.id);
        const newIndex = items.findIndex(item => item.id === over.id);
        const newItems = arrayMove(items, oldIndex, newIndex);
        handleReorder(newItems);
        console.log(newItems);
        return newItems;
      });
    }
  }
  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={handleDragEnd}
    >
      <SortableContext
        items={items}
        strategy={verticalListSortingStrategy}
      >
        {items.map((item) => <SortableItem key={item.id} id={item.id} item={item} />)}
      </SortableContext>
    </DndContext>
  );

  
}
// items keys generalized for different strategies
SortableList.propTypes = {
  items: PropTypes.shape({
      name: PropTypes.string.isRequired,
      amount: PropTypes.string.isRequired,
      percentage: PropTypes.string.isRequired,
      additional: PropTypes.string,
    }).isRequired,
  handleReorder: PropTypes.func.isRequired,
};

export default SortableList;