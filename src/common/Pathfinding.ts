// javascript-astar 0.4.1
// http://github.com/bgrins/javascript-astar
// Freely distributable under the MIT License.
// Implements the astar search algorithm in javascript using a Binary Heap.
// Includes Binary Heap (with modifications) from Marijn Haverbeke.
// http://eloquentjavascript.net/appendix2.html
// Adapted for TypeScript by Tim Ings

export class GridNode {
    public x: number;
    public y: number;
    public weight: number;
    public f: number;
    public g: number;
    public h: number;
    public visited: boolean;
    public closed: boolean;
    public parent: GridNode;

    public constructor(x: number, y: number, weight: number) {
        this.x = x;
        this.y = y;
        this.weight = weight;
    }

    public toString() {
        return `[${this.x} ${this.y}]`;
    }

    public getCost(fromNeighbor: GridNode) {
        // Take diagonal weight into consideration.
        if (fromNeighbor && fromNeighbor.x !== this.x && fromNeighbor.y !== this.y) {
            return this.weight * 1.41421;
        }
        return this.weight;
    }

    public isWall() {
        return this.weight === 0;
    }

    public clean() {
        this.f = 0;
        this.g = 0;
        this.h = 0;
        this.visited = false;
        this.closed = false;
        this.parent = null;
    }

    public pathTo() {
        let curr: GridNode = this;
        const path = [];
        while (curr.parent) {
            path.unshift(curr);
            curr = curr.parent;
        }
        return path;
    }
}

/**
   * A graph memory structure
   * @param {Array} gridIn 2D array of input weights
   */
export class Graph {
    public nodes: Array<GridNode>;
    public grid: Array<Array<GridNode>>;
    public dirtyNodes: Array<GridNode>;

    public constructor(gridIn: Array<Array<number>>) {
        this.nodes = [];
        this.grid = [];
        for (let x = 0; x < gridIn.length; x++) {
            this.grid[x] = [];

            for (let y = 0, row = gridIn[x]; y < row.length; y++) {
                const node = new GridNode(x, y, row[y]);
                this.grid[x][y] = node;
                this.nodes.push(node);
            }
        }
        this.init();
    }

    public init() {
        this.dirtyNodes = [];
        for (let i = 0; i < this.nodes.length; i++) {
            this.nodes[i].clean();
        }
    }

    public cleanDirty() {
        for (let i = 0; i < this.dirtyNodes.length; i++) {
            this.dirtyNodes[i].clean();
        }
        this.dirtyNodes = [];
    }

    public markDirty(node: GridNode) {
        this.dirtyNodes.push(node);
    }

    public neighbors(node: GridNode) {
        const ret = [];
        const { x } = node;
        const { y } = node;
        const { grid } = this;

        // West
        if (grid[x - 1] && grid[x - 1][y]) {
            ret.push(grid[x - 1][y]);
        }

        // East
        if (grid[x + 1] && grid[x + 1][y]) {
            ret.push(grid[x + 1][y]);
        }

        // South
        if (grid[x] && grid[x][y - 1]) {
            ret.push(grid[x][y - 1]);
        }

        // North
        if (grid[x] && grid[x][y + 1]) {
            ret.push(grid[x][y + 1]);
        }

        // Southwest
        if (grid[x - 1] && grid[x - 1][y - 1]) {
            ret.push(grid[x - 1][y - 1]);
        }

        // Southeast
        if (grid[x + 1] && grid[x + 1][y - 1]) {
            ret.push(grid[x + 1][y - 1]);
        }

        // Northwest
        if (grid[x - 1] && grid[x - 1][y + 1]) {
            ret.push(grid[x - 1][y + 1]);
        }

        // Northeast
        if (grid[x + 1] && grid[x + 1][y + 1]) {
            ret.push(grid[x + 1][y + 1]);
        }

        return ret;
    }

    public toString() {
        const graphString = [];
        const nodes = this.grid;
        for (let x = 0; x < nodes.length; x++) {
            const rowDebug = [];
            const row = nodes[x];
            for (let y = 0; y < row.length; y++) {
                rowDebug.push(row[y].weight);
            }
            graphString.push(rowDebug.join(' '));
        }
        return graphString.join('\n');
    }
}

export class BinaryHeap {
    private content: Array<GridNode>;
    private scoreFunction: (n: GridNode) => number;

    public constructor(scoreFunction: (n: GridNode) => number) {
        this.content = [];
        this.scoreFunction = scoreFunction;
    }

    public push(element: GridNode) {
        // Add the new element to the end of the array.
        this.content.push(element);

        // Allow it to sink down.
        this.sinkDown(this.content.length - 1);
    }

    public pop() {
        // Store the first element so we can return it later.
        const result = this.content[0];
        // Get the element at the end of the array.
        const end = this.content.pop();
        // If there are any elements left, put the end element at the
        // start, and let it bubble up.
        if (this.content.length > 0) {
            this.content[0] = end;
            this.bubbleUp(0);
        }
        return result;
    }

    public remove(node: GridNode) {
        const i = this.content.indexOf(node);

        // When it is found, the process seen in 'pop' is repeated
        // to fill up the hole.
        const end = this.content.pop();

        if (i !== this.content.length - 1) {
            this.content[i] = end;

            if (this.scoreFunction(end) < this.scoreFunction(node)) {
                this.sinkDown(i);
            } else {
                this.bubbleUp(i);
            }
        }
    }

    public size() {
        return this.content.length;
    }

    public rescoreElement(node: GridNode) {
        this.sinkDown(this.content.indexOf(node));
    }

    public sinkDown(n: number) {
        // Fetch the element that has to be sunk.
        let idx = n;
        const element = this.content[idx];

        // When at 0, an element can not sink any further.
        while (idx > 0) {
        // Compute the parent element's index, and fetch it.
            const parentIdx = ((idx + 1) >> 1) - 1;
            const parent = this.content[parentIdx];
            // Swap the elements if the parent is greater.
            if (this.scoreFunction(element) < this.scoreFunction(parent)) {
                this.content[parentIdx] = element;
                this.content[idx] = parent;
                // Update 'idx' to continue at the new position.
                idx = parentIdx;
            } else { // Found a parent that is less, no need to sink any further.
                break;
            }
        }
    }

    public bubbleUp(n: number) {
        let idx = n;
        // Look up the target element and its score.
        const { length } = this.content;
        const element = this.content[idx];
        const elemScore = this.scoreFunction(element);

        while (true) {
            // Compute the indices of the child elements.
            const child2Idx = (idx + 1) << 1;
            const child1Idx = child2Idx - 1;
            // This is used to store the new position of the element, if any.
            let swap = null;
            let child1Score: number;
            // If the first child exists (is inside the array)...
            if (child1Idx < length) {
                // Look it up and compute its score.
                const child1 = this.content[child1Idx];
                child1Score = this.scoreFunction(child1);

                // If the score is less than our element's, we need to swap.
                if (child1Score < elemScore) {
                    swap = child1Idx;
                }
            }

            // Do the same checks for the other child.
            if (child2Idx < length) {
                const child2 = this.content[child2Idx];
                const child2Score = this.scoreFunction(child2);
                if (child2Score < (swap === null ? elemScore : child1Score)) {
                    swap = child2Idx;
                }
            }

            // If the element needs to be moved, swap it, and continue.
            if (swap !== null) {
                this.content[idx] = this.content[swap];
                this.content[swap] = element;
                idx = swap;
            } else { // Otherwise, we are done.
                break;
            }
        }
    }
}

// See list of heuristics: http://theory.stanford.edu/~amitp/GameProgramming/Heuristics.html
export class heuristics {
    public static manhattan = (pos0: GridNode, pos1: GridNode) => {
        const d1 = Math.abs(pos1.x - pos0.x);
        const d2 = Math.abs(pos1.y - pos0.y);
        return d1 + d2;
    };

    public static diagonal = (pos0: GridNode, pos1: GridNode) => {
        const D = 1;
        const D2 = Math.sqrt(2);
        const d1 = Math.abs(pos1.x - pos0.x);
        const d2 = Math.abs(pos1.y - pos0.y);
        return (D * (d1 + d2)) + ((D2 - (2 * D)) * Math.min(d1, d2));
    };
}

export class astar {
    /**
    * Perform an A* Search on a graph given a start and end node.
    * @param {Graph} graph
    * @param {GridNode} start
    * @param {GridNode} end
    * @param {Object} [options]
    * @param {bool} [options.closest] Specifies whether to return the
               path to the closest node if the target is unreachable.
    * @param {Function} [options.heuristic] Heuristic function (see
    *          astar.heuristics).
    */
    public static search(graph: Graph, start: GridNode, end: GridNode,
        heuristic: (pos0: GridNode, pos1: GridNode) => number = heuristics.manhattan,
        closest: boolean = true) {
        graph.cleanDirty();

        const openHeap = new BinaryHeap(((node) => node.f));
        let closestNode = start; // set the start node to be the closest if required

        start.h = heuristic(start, end);
        graph.markDirty(start);

        openHeap.push(start);

        while (openHeap.size() > 0) {
        // Grab the lowest f(x) to process next.  Heap keeps this sorted for us.
            const currentNode = openHeap.pop();

            // End case -- result has been found, return the traced path.
            if (currentNode === end) {
                return currentNode.pathTo();
            }

            // Normal case -- move currentNode from open to closed, process each of its neighbors.
            currentNode.closed = true;

            // Find all neighbors for the current node.
            const neighbors = graph.neighbors(currentNode);

            for (let i = 0, il = neighbors.length; i < il; ++i) {
                const neighbor = neighbors[i];

                if (neighbor.closed || neighbor.isWall()) {
                    // Not a valid node to process, skip to next neighbor.
                    continue;
                }

                // The g score is the shortest distance from start to current node.
                // We need to check if the path we have arrived at this neighbor is the shortest one we have seen yet.
                const gScore = currentNode.g + neighbor.getCost(currentNode);
                const beenVisited = neighbor.visited;

                if (!beenVisited || gScore < neighbor.g) {
                    // Found an optimal (so far) path to this node.  Take score for node to see how good it is.
                    neighbor.visited = true;
                    neighbor.parent = currentNode;
                    neighbor.h = neighbor.h || heuristic(neighbor, end);
                    neighbor.g = gScore;
                    neighbor.f = neighbor.g + neighbor.h;
                    graph.markDirty(neighbor);
                    if (closest) {
                        // If the neighbour is closer than the current closestNode or if it's equally close but has
                        // a cheaper path than the current closest node then it becomes the closest node
                        if (neighbor.h < closestNode.h || (neighbor.h === closestNode.h && neighbor.g < closestNode.g)) {
                            closestNode = neighbor;
                        }
                    }

                    if (!beenVisited) {
                        // Pushing to heap will put it in proper place based on the 'f' value.
                        openHeap.push(neighbor);
                    } else {
                        // Already seen the node, but since it has been rescored we need to reorder it in the heap
                        openHeap.rescoreElement(neighbor);
                    }
                }
            }
        }

        if (closest) {
            return closestNode.pathTo();
        }

        // No result was found - empty array signifies failure to find path.
        return [];
    }
}
