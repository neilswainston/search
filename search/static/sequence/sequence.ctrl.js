sequenceApp.controller("sequenceCtrl", function($scope) {
	var self = this;
	self.secondaryStructure = [];
	
	$scope.$watch(angular.bind(this, function() {
		// TODO: self.enzyme not present in this controller.
		// Needs "sharing" with search.ctrl.js.
		return self.enzyme;
	}), function(newVal) {
		updateSecondaryStructure();
	});
	
	updateSecondaryStructure = function() {
		self.secondaryStructure = [];

		if(self.enzyme) {
			for(var i=0; i < self.enzyme.Sequence.length; i++) {
				self.secondaryStructure.push("");
			}

			setSecondaryStructure(self.enzyme["Beta strand"], "beta-strand");
			setSecondaryStructure(self.enzyme["Helix"], "helix");
			setSecondaryStructure(self.enzyme["Turn"], "turn");
		}
	};

	setSecondaryStructure = function(secStruct, className) {
		for(var i = 0; i < secStruct.length; i++) {
			obj = secStruct[i];

			for(var j = obj["start"] - 1; j < obj["end"]; j++) {
				self.secondaryStructure[j] = className;
			}
		}
	};
});