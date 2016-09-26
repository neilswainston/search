searchApp.controller("searchCtrl", function($scope) {
	var self = this;
	self.chemical = null;
	self.enzyme = null;
	self.organism = null;
	self.residue = null;
	self.pdbIndex = 0;
	self.structureText = null;

	self.range = function(min, max, step) {
		step = step || 1;
		var input = [];
		for(i = min; i < max; i += step) {
			input.push(i);
		}
		return input;
	};
	
	
	/* STRUCTURE */
	
	var mol = null;
	var geom = null;
	var selectedAtoms = [];

	var options = {
			width: 'auto',
			height: 'auto',
			antialias: true,
			quality: 'medium'
	};
	
	var viewer = pv.Viewer(document.getElementById("structure-viewer"), options);

	viewer.fitParent();

	window.onresize = function(event) {
		viewer.fitParent();
	};
	
	$scope.$watch(angular.bind(this, function() {
		return self.enzyme;
	}), function(newVal) {
		self.updateStructure(0);
	});
	
	$scope.$watch(angular.bind(this, function() {
		return self.residue;
	}), function(newVal) {
		highlightResidue();
	});
	
	self.updateStructure = function(increment) {
		clearStructure();

		self.pdbIndex = self.pdbIndex + increment;

		if(self.enzyme && self.enzyme['Cross-reference (PDB)'].length) {
			pv.io.fetchPdb('http://files.rcsb.org/download/' + self.enzyme['Cross-reference (PDB)'][self.pdbIndex]['id'] + '.pdb', function(newMol) {
				mol = newMol;
				geom = viewer.cartoon('protein', mol, {color: color.bySS()});
				selectedAtoms = [];
				viewer.autoZoom();
			});
		}
	};

	clearStructure = function() {
		mol = null;
		geom = null;
		selectedAtoms = [];
		viewer.clear();
		viewer.requestRedraw();
		self.structureText = null;
	}
	
	highlightResidue = function() {
		if(mol) {
			// Revert currently selected atoms:
			for(var i = 0; i < selectedAtoms.length; i++) {
				setColorForAtom(selectedAtoms[i].atom, selectedAtoms[i].color);
			}

			self.structureText = null;
			selectedAtoms = [];

			// Colour newly selected atoms in each chain:
			if(self.residue) {
				var chains = mol.chains();

				for(var i = 0; i < chains.length; i++) {
					var chainName = chains[i].name();
					var atom = mol.atom(chainName + '.' + self.residue + '.CA');

					if(atom !== null) {
						var color = [0,0,0,0];
						geom.getColorForAtom(atom, color);
						selectedAtoms.push({atom: atom, color: color});
						setColorForAtom(atom, 'red');
						self.structureText = atom.qualifiedName().split(".")[1];
					}
				}
			}

			viewer.requestRedraw();
		}
	};

	setColorForAtom = function(atom, color) {
		var view = mol.createEmptyView();
		view.addAtom(atom);
		geom.colorBy(pv.color.uniform(color), view);
	}
});