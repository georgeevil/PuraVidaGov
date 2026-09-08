/**
 * Keeps React 18 alive when something outside React rewrites the DOM under it.
 *
 * Chrome's page translator (the portal is `lang="es"`, and many visitors browse in English) replaces
 * text nodes with `<font>` elements. React then calls `removeChild` / `insertBefore` with nodes that
 * are no longer children of the parent it remembers, the browser throws `NotFoundError`, and the
 * whole tree unmounts to a blank page. Some translation and grammar extensions do the same.
 *
 * The guard makes those two calls tolerant: a removal of a node that is no longer there is a no-op,
 * and an insertion before a node that moved falls back to appending. Translation keeps working and
 * React keeps rendering. This is the widely used workaround for React issue #11538.
 */
export function installDomGuard(): void {
  if (typeof Node === 'undefined') return;
  const proto = Node.prototype;
  const originalRemoveChild = proto.removeChild;
  const originalInsertBefore = proto.insertBefore;

  proto.removeChild = function <T extends Node>(this: Node, child: T): T {
    if (child.parentNode !== this) {
      if (import.meta.env.DEV) console.warn('dom-guard: ignoring removeChild of a node that moved', child);
      return child;
    }
    return originalRemoveChild.call(this, child) as T;
  };

  proto.insertBefore = function <T extends Node>(this: Node, newNode: T, referenceNode: Node | null): T {
    if (referenceNode && referenceNode.parentNode !== this) {
      if (import.meta.env.DEV) console.warn('dom-guard: reference node moved, appending instead', referenceNode);
      return originalInsertBefore.call(this, newNode, null) as T;
    }
    return originalInsertBefore.call(this, newNode, referenceNode) as T;
  };
}
