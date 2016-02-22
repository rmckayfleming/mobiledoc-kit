import { DIRECTION } from '../utils/key';

function clearSelection() {
  // FIXME-IE ensure this works on IE 9. It works on IE10.
  window.getSelection().removeAllRanges();
}

function textRects(node) {
  let range = document.createRange();
  range.setEnd(node, node.nodeValue.length);
  range.setStart(node, 0);
  return range.getClientRects();
}

function findOffsetInText(node, coords) {
  let len = node.nodeValue.length;
  let range = document.createRange();
  for (let i = 0; i < len; i++) {
    range.setEnd(node, i + 1);
    range.setStart(node, i);
    let rect = range.getBoundingClientRect();
    if (rect.top === rect.bottom) {
      continue;
    }
    if (rect.left <= coords.left && rect.right >= coords.left &&
        rect.top <= coords.top && rect.bottom >= coords.top) {
      return {node, offset: i + (coords.left >= (rect.left + rect.right) / 2 ? 1 : 0)};
    }
  }
  return {node, offset: 0};
}

function findOffsetInNode(node, coords) {
  let closest, dyClosest = 1e8, coordsClosest, offset = 0;
  for (let child = node.firstChild; child; child = child.nextSibling) {
    let rects;
    if (child.nodeType === 1) {
      rects = child.getClientRects();
    } else if (child.nodeType === 3) {
      rects = textRects(child);
    } else {
      continue;
    }

    for (let i = 0; i < rects.length; i++) {
      let rect = rects[i];
      if (rect.left <= coords.left && rect.right >= coords.left) {
        let dy = rect.top > coords.top ? rect.top - coords.top
            : rect.bottom < coords.top ? coords.top - rect.bottom : 0;
        if (dy < dyClosest) {
          closest = child;
          dyClosest = dy;
          coordsClosest = dy ? {left: coords.left, top: rect.top} : coords;
          if (child.nodeType === 1 && !child.firstChild) {
            offset = i + (coords.left >= (rect.left + rect.right) / 2 ? 1 : 0);
          }
          continue;
        }
      }
      if (!closest &&
          (coords.top >= rect.bottom || coords.top >= rect.top && coords.left >= rect.right)) {
        offset = i + 1;
      }
    }
  }
  if (!closest) {
    return {node, offset};
  }
  if (closest.nodeType === 3) {
    return findOffsetInText(closest, coordsClosest);
  }
  if (closest.firstChild) {
    return findOffsetInNode(closest, coordsClosest);
  }
  return {node, offset};
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
  if (position & Node.DOCUMENT_POSITION_CONTAINS) {
    return comparePosition({
      focusNode: focusNode.childNodes[focusOffset],
      focusOffset: 0,
      anchorNode, anchorOffset
    });
  } else if (position & Node.DOCUMENT_POSITION_CONTAINED_BY) {
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
  } else if (position & Node.DOCUMENT_POSITION_FOLLOWING) {
    headNode = anchorNode; tailNode = focusNode;
    headOffset = anchorOffset; tailOffset = focusOffset;
    direction = DIRECTION.FORWARD;
  } else if (position & Node.DOCUMENT_POSITION_PRECEDING) {
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
  comparePosition,
  findOffsetInNode
};
