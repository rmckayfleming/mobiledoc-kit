import { DIRECTION } from '../utils/key';
import { isTextNode } from '../utils/dom-utils';

function clearSelection() {
  window.getSelection().removeAllRanges();
}

// IE will sometimes report that the focusNode is the editor element and
// the focus offset is editor.childNodes.length (i.e., an offset greater than
// the max we would expect). In that case this function finds the innermost
// last node of the childnodes and returns an offset equal to its length.
// @return {Object} with `node` and `offset` properties
function endOf(node) {
  if (node.childNodes.length) {
    let lastChild = node.lastChild;
    if (isTextNode(lastChild)) {
      return { node: lastChild, offset: lastChild.textContent.length };
    } else {
      return endOf(lastChild);
    }
  } else {
    return { node, offset: node.textContent.length };
  }
}

function comparePosition(selection) {
  let { anchorNode, focusNode, anchorOffset, focusOffset } = selection;
  let headNode, tailNode, headOffset, tailOffset, direction;

  const position = anchorNode.compareDocumentPosition(focusNode);

  // IE may select return focus and anchor nodes far up the DOM tree instead of
  // picking the deepest, most specific possible node. For example in
  //
  //     <div><span>abc</span><span>def</span></div>
  //
  // with a cursor between c and d, IE might say the focusNode is <div> with
  // an offset of 1. However the anchorNode for a selection might still be
  // <span> 2 if there was a selection.
  //
  // This code walks down the DOM tree until a good comparison of position can be
  // made.
  //
  if (position & Node.DOCUMENT_POSITION_CONTAINS) { // focusNode contains anchorNode
    let nextFocusNode;
    if (focusOffset >= focusNode.childNodes.length) {
      let details = endOf(focusNode);
      nextFocusNode = details.node;
      focusOffset   = details.offset;
    } else {
      nextFocusNode = focusNode.childNodes[focusOffset];
      focusOffset = 0;
    }
    return comparePosition({
      focusNode: nextFocusNode, //focusNode.childNodes[focusOffset],
      focusOffset: focusOffset,
      anchorNode, anchorOffset
    });
  } else if (position & Node.DOCUMENT_POSITION_CONTAINED_BY) { // focusNode contained by anchorNode
    let offset = anchorOffset - 1;
    if (offset < 0) {
      offset = 0;
    }
    return comparePosition({
      anchorNode: anchorNode.childNodes[offset],
      anchorOffset: 0,
      focusNode, focusOffset
    });
  // The meat of translating anchor and focus nodes to head and tail nodes
  } else if (position & Node.DOCUMENT_POSITION_FOLLOWING) { // focusNode follows anchorNode
    headNode = anchorNode; tailNode = focusNode;
    headOffset = anchorOffset; tailOffset = focusOffset;
    direction = DIRECTION.FORWARD;
  } else if (position & Node.DOCUMENT_POSITION_PRECEDING) { // focusNode precedes anchorNode
    headNode = focusNode; tailNode = anchorNode;
    headOffset = focusOffset; tailOffset = anchorOffset;
    direction = DIRECTION.BACKWARD;
  } else { // same node
    headNode = tailNode = anchorNode;
    headOffset = anchorOffset;
    tailOffset = focusOffset;
    if (tailOffset < headOffset) {
      // Swap the offset order
      headOffset = focusOffset;
      tailOffset = anchorOffset;
      direction = DIRECTION.BACKWARD;
    } else if (headOffset < tailOffset) {
      direction = DIRECTION.FORWARD;
    } else {
      direction = null;
    }
  }

  return {headNode, headOffset, tailNode, tailOffset, direction};
}

export {
  clearSelection,
  comparePosition
};
