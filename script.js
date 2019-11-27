/* 
Improvements:
- Update hitbox's target list when new targets are available?
- Add sorting when 2 or more hitbox targets are in a hitbox
*/

// Global
// Event Helpers
const MOUSE_ONE = 0;
const MOUSE_SECOND = 2;

// Classes
const HITBOX_CLASS = "hitbox";
const HITBOX_TARGET_CLASS = "hitboxTarget";
const HITBOX_TARGET_ACTIVE_CLASS = "hitboxTarget--dragging";
const HITBOX_TARGET_INACTIVE_CLASS = "hitboxTarget--inactive";

// Schema
class HitBoxNode {
  constructor({
    node,
    parent
  }) {
    this.node = node;
    this.parent = parent;
  }
}

class HitBoxNodeContainsChildren extends HitBoxNode {
  constructor(options) {
    super(options);

    this._node = options.node;
    this.collection = [];
  }
  /**
   * Will recursively scan all child elements
   * and execute the callback function on each child
   * node
   * @param {String} targetClass
   * @param {Object<Class>} childClass 
   */
  getTargetChildNodes = (targetClass, childClass) => {
    // Gets last child in tree that is the first child
    let children = Array.from(this._node.children);
    let nextChild;

    if (children.length === 0) {
      return false;
    }

    // Child to check
    nextChild = children[0];

    // Check next child
    this._node = nextChild;

    // Call
    this.getTargetChildNodes(targetClass, childClass);

    // Reset
    this._node = null;

    // Only output child that are hitboxes
    while (nextChild !== null) {
      if (nextChild.classList.contains(targetClass)) {
        this.collection.push(new childClass({
          node: nextChild,
          parent: this
        }));
      }

      nextChild = nextChild.nextElementSibling
    }
  }
}

class HitBoxTarget extends HitBoxNode {
  constructor(options) {
    super(options);
    this.node.addEventListener("mousedown", this.onMouseDown);
    this.node.addEventListener("mouseup", this.onMouseUp);
  }
  onMouseUp = (event) => {
    event.preventDefault();
    let dragAndDropParent = this.parent.parent;

    if (event.button === MOUSE_SECOND) return;
    if (dragAndDropParent.getActiveTarget !== this) return;

    // Target is the same reset the active target
    dragAndDropParent.resetActiveTarget();
    dragAndDropParent.resetActiveTargetClone();
  }
  onMouseDown = (event) => {
    event.preventDefault();
    let dragAndDropParent = this.parent.parent;

    if (event.button === MOUSE_SECOND) return;

    dragAndDropParent.setActiveTarget = this;
  }
}

class HitBox extends HitBoxNodeContainsChildren {
  constructor(options) {
    super(options);

    this.clientRect = this.node.getBoundingClientRect();

    this.getTargetChildNodes(HITBOX_TARGET_CLASS, HitBoxTarget);

    this.node.addEventListener("mouseup", this.onMouseUp);
    this.node.addEventListener("mousedown", this.onMouseDown);
  }
  onMouseDown = (event) => {
    event.preventDefault();
    if (event.button === MOUSE_SECOND) return;
    this.parent.setActiveHitbox = undefined;
  }
  onMouseUp = (event) => {
    event.preventDefault();
    if (event.button === MOUSE_SECOND) return;
    this.parent.setActiveHitbox = this;
  }
}

class DragAndDrop extends HitBoxNodeContainsChildren {
  constructor(node) {
    super({
      node: node,
      parent: null
    });

    // Set height of container
    this.node.style.minHeight = this.node.offsetHeight;

    // Clone of active node
    this.activeTargetClone;

    // Active Elements
    this.hitboxActive;
    this.targetActive;

    // Get Hitboxes
    this.getTargetChildNodes(HITBOX_CLASS, HitBox);

    // Events
    this.node.addEventListener("mousedown", this.onMouseDown);
    window.addEventListener("mouseup", this.onMouseUp);
  }

  set setActiveHitbox(hitbox) {
    this.hitboxActive = hitbox;
  }

  get getActiveHitbox() {
    return this.hitboxActive;
  }

  set setActiveTarget(target) {
    this.targetActive = target;
  }

  get getActiveTarget() {
    return this.targetActive;
  }

  onMouseDown = (event) => {
    event.preventDefault();

    // Only allow mouse one
    if (event.button === MOUSE_SECOND) return;

    // Only continue if we have a target
    if (this.getActiveTarget === undefined) return;

    // Active draggable target
    let activeTarget = this.getActiveTarget;

    // Clone
    this.activeTargetClone = activeTarget.node.cloneNode(true);

    // Set properties
    this.activeTargetClone.style.width = activeTarget.node.offsetWidth;
    this.activeTargetClone.style.height = activeTarget.node.offsetHeight;
    this.activeTargetClone.style.top = activeTarget.node.offsetTop;
    this.activeTargetClone.style.left = activeTarget.node.offsetLeft;

    // Set Disable Class
    this.getActiveTarget.node.classList.add(HITBOX_TARGET_INACTIVE_CLASS);

    this.activeTargetClone.classList.add(HITBOX_TARGET_ACTIVE_CLASS);

    this.node.append(this.activeTargetClone);

    // Add event
    window.addEventListener("mousemove", this.onMove);
  }

  onMove = (event) => {
    event.preventDefault();

    if (event.button === MOUSE_SECOND) return;

    let activeTargetCloneTop = parseInt(this.activeTargetClone.style.top.replace("px"), 10);
    let activeTargetCloneLeft = parseInt(this.activeTargetClone.style.left.replace("px"), 10);

    this.activeTargetClone.style.top = activeTargetCloneTop + event.movementY;
    this.activeTargetClone.style.left = activeTargetCloneLeft + event.movementX;
  }

  onMouseUp = (event) => {
    event.preventDefault();

    // Remove window event
    window.removeEventListener("mousemove", this.onMove);

    // No active target
    if (this.getActiveTarget === undefined) {
      this.resetActiveHitbox();
      return;
    };

    // Reset active target clone
    this.resetActiveTargetClone();

    // No active hitbox
    if (this.getActiveHitbox === undefined) {
      // Reset active target
      this.resetActiveTarget();
      return;
    };

    // Move target to hitbox
    this.getActiveHitbox.node.prepend(this.getActiveTarget.node);

    // Reset active elements
    this.resetActiveTarget();
    this.resetActiveHitbox();
  }

  resetActiveTargetClone = () => {
    this.activeTargetClone.remove();
    this.activeTargetClone = null;
  }

  resetActiveTarget = () => {
    this.getActiveTarget.node.classList.remove(HITBOX_TARGET_INACTIVE_CLASS);
    this.setActiveTarget = undefined;
  }

  resetActiveHitbox = () => {
    this.setActiveHitbox = undefined;
  }
}

console.log(
  new DragAndDrop(document.getElementById("drop"))
);