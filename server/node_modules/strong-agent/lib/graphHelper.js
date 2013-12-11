module.exports = {

	startNode: function startNode(name, q, nf) {
		if (nf.graph == undefined) return;

		var nodeId = nf.graph.nodes.length;
		var node = { name: name, q: q, start: Date.now(), value: 1 };
		nf.graph.nodes.push(node);

		var link = { source: nf.currentNode, target: nodeId, value: 1 };
		nf.graph.links.push(link);

		var prevNode = nf.currentNode;
		nf.currentNode = nodeId;

		return {
			node: node,
			link: link,
			prevNode: prevNode
		};
	},

	updateTimes: function updateTimes(graphNode, time) {
		if (graphNode == undefined) return;
		graphNode.node.value = time.ms || 1;
		graphNode.link.value = time.ms || 1;
	}

};