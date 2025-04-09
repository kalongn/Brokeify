import { PropTypes } from 'prop-types';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { TbGridDots } from "react-icons/tb";
import styles from './Sortable.module.css';

const SortableItem = ({ id, item }) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
  } = useSortable({ id: id });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };
  return (
    <div ref={setNodeRef} style={style} className={styles.sortableItem} {...attributes} {...listeners}>
      <TbGridDots className={styles.dragIcon} />
      <div className={styles.text}>
        <h2 className={styles.name}>{item.id}</h2>
        <p>{item.amount} - {item.percentage} - {item.additional}</p>
      </div>
    </div>
  );
}
// PropTypes validation
SortableItem.propTypes = {
  id: PropTypes.string.isRequired,
  item: PropTypes.string.isRequired,
};

export default SortableItem;