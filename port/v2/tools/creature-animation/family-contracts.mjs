import {SPECIALIZED_TEMPLATES} from './specialized-templates.mjs';
/** Contracted anatomy inventories from the read-only motion producer.
 * These describe supported topologies, not painter coverage or art acceptance. */
import {projectTemplateLimits} from './pose-projection.mjs';
import {resolveAnatomyInventory} from './anatomy-inventory.mjs';
const contracts = [
  {
    "id": "quadruped",
    "version": 1,
    "clipSetId": "quadruped-land-v1",
    "graph": [
      [
        "pelvis",
        "root"
      ],
      [
        "spine",
        "pelvis"
      ],
      [
        "chest",
        "spine"
      ],
      [
        "neck",
        "chest"
      ],
      [
        "head",
        "neck"
      ],
      [
        "jaw",
        "head"
      ],
      [
        "hindFarRoot",
        "pelvis"
      ],
      [
        "hindFarKnee",
        "hindFarRoot"
      ],
      [
        "hindFarAnkle",
        "hindFarKnee"
      ],
      [
        "hindFarPaw",
        "hindFarAnkle"
      ],
      [
        "foreFarRoot",
        "chest"
      ],
      [
        "foreFarKnee",
        "foreFarRoot"
      ],
      [
        "foreFarAnkle",
        "foreFarKnee"
      ],
      [
        "foreFarPaw",
        "foreFarAnkle"
      ],
      [
        "hindNearRoot",
        "pelvis"
      ],
      [
        "hindNearKnee",
        "hindNearRoot"
      ],
      [
        "hindNearAnkle",
        "hindNearKnee"
      ],
      [
        "hindNearPaw",
        "hindNearAnkle"
      ],
      [
        "foreNearRoot",
        "chest"
      ],
      [
        "foreNearKnee",
        "foreNearRoot"
      ],
      [
        "foreNearAnkle",
        "foreNearKnee"
      ],
      [
        "foreNearPaw",
        "foreNearAnkle"
      ],
      [
        "tail0",
        "pelvis"
      ],
      [
        "tail1",
        "tail0"
      ],
      [
        "tail2",
        "tail1"
      ],
      [
        "tail3",
        "tail2"
      ],
      [
        "earFarRoot",
        "head"
      ],
      [
        "earFarTip",
        "earFarRoot"
      ],
      [
        "earNearRoot",
        "head"
      ],
      [
        "earNearTip",
        "earNearRoot"
      ]
    ],
    "bodyAxis": [
      "pelvis",
      "chest"
    ],
    "joints": [
      "root",
      "pelvis",
      "spine",
      "chest",
      "neck",
      "head",
      "jaw",
      "hindFarRoot",
      "hindFarKnee",
      "hindFarAnkle",
      "hindFarPaw",
      "foreFarRoot",
      "foreFarKnee",
      "foreFarAnkle",
      "foreFarPaw",
      "hindNearRoot",
      "hindNearKnee",
      "hindNearAnkle",
      "hindNearPaw",
      "foreNearRoot",
      "foreNearKnee",
      "foreNearAnkle",
      "foreNearPaw",
      "tail0",
      "tail1",
      "tail2",
      "tail3",
      "earFarRoot",
      "earFarTip",
      "earNearRoot",
      "earNearTip"
    ],
    "legs": [
      "hindFar",
      "foreFar",
      "hindNear",
      "foreNear"
    ],
    "limitsDeg": {
      "root": {
        "min": -15,
        "max": 15
      },
      "pelvis": {
        "min": -20,
        "max": 20
      },
      "spine": {
        "min": -25,
        "max": 25
      },
      "chest": {
        "min": -20,
        "max": 20
      },
      "neck": {
        "min": -35,
        "max": 35
      },
      "head": {
        "min": -35,
        "max": 35
      },
      "jaw": {
        "min": -30,
        "max": 5
      },
      "hindFarRoot": {
        "min": -60,
        "max": 60
      },
      "hindFarKnee": {
        "min": -75,
        "max": 75
      },
      "hindFarAnkle": {
        "min": -60,
        "max": 60
      },
      "hindFarPaw": {
        "min": -40,
        "max": 40
      },
      "foreFarRoot": {
        "min": -60,
        "max": 60
      },
      "foreFarKnee": {
        "min": -75,
        "max": 75
      },
      "foreFarAnkle": {
        "min": -60,
        "max": 60
      },
      "foreFarPaw": {
        "min": -40,
        "max": 40
      },
      "hindNearRoot": {
        "min": -60,
        "max": 60
      },
      "hindNearKnee": {
        "min": -75,
        "max": 75
      },
      "hindNearAnkle": {
        "min": -60,
        "max": 60
      },
      "hindNearPaw": {
        "min": -40,
        "max": 40
      },
      "foreNearRoot": {
        "min": -60,
        "max": 60
      },
      "foreNearKnee": {
        "min": -75,
        "max": 75
      },
      "foreNearAnkle": {
        "min": -60,
        "max": 60
      },
      "foreNearPaw": {
        "min": -40,
        "max": 40
      },
      "tail0": {
        "min": -40,
        "max": 40
      },
      "tail1": {
        "min": -50,
        "max": 50
      },
      "tail2": {
        "min": -50,
        "max": 50
      },
      "tail3": {
        "min": -50,
        "max": 50
      },
      "earFarRoot": {
        "min": -60,
        "max": 60
      },
      "earFarTip": {
        "min": -40,
        "max": 40
      },
      "earNearRoot": {
        "min": -60,
        "max": 60
      },
      "earNearTip": {
        "min": -40,
        "max": 40
      }
    },
    "bounds": [
      {
        "id": "torso",
        "min": 0.08,
        "max": 0.65,
        "kind": "distance",
        "axis": [
          "pelvis",
          "chest"
        ]
      },
      {
        "id": "head",
        "min": 0.015,
        "max": 0.75,
        "kind": "distance",
        "axis": [
          "neck",
          "head"
        ]
      },
      {
        "id": "head/torso",
        "min": 0.02,
        "max": 1.6,
        "kind": "ratio",
        "bones": [
          "head"
        ],
        "axis": [
          "pelvis",
          "chest"
        ]
      },
      {
        "id": "bone-min",
        "min": 0.001,
        "max": 0.75,
        "kind": "bone-min"
      },
      {
        "id": "bone-max",
        "min": 0.001,
        "max": 0.75,
        "kind": "bone-max"
      },
      {
        "id": "leg/torso:hindFar",
        "min": 0.25,
        "max": 2.7,
        "kind": "ratio",
        "bones": [
          "hindFarKnee",
          "hindFarAnkle",
          "hindFarPaw"
        ],
        "axis": [
          "pelvis",
          "chest"
        ]
      },
      {
        "id": "leg/torso:foreFar",
        "min": 0.25,
        "max": 2.7,
        "kind": "ratio",
        "bones": [
          "foreFarKnee",
          "foreFarAnkle",
          "foreFarPaw"
        ],
        "axis": [
          "pelvis",
          "chest"
        ]
      },
      {
        "id": "leg/torso:hindNear",
        "min": 0.25,
        "max": 2.7,
        "kind": "ratio",
        "bones": [
          "hindNearKnee",
          "hindNearAnkle",
          "hindNearPaw"
        ],
        "axis": [
          "pelvis",
          "chest"
        ]
      },
      {
        "id": "leg/torso:foreNear",
        "min": 0.25,
        "max": 2.7,
        "kind": "ratio",
        "bones": [
          "foreNearKnee",
          "foreNearAnkle",
          "foreNearPaw"
        ],
        "axis": [
          "pelvis",
          "chest"
        ]
      }
    ]
  },
  {
    "id": "hopper",
    "version": 1,
    "clipSetId": "hopper-land-v1",
    "graph": [
      [
        "pelvis",
        "root"
      ],
      [
        "spine",
        "pelvis"
      ],
      [
        "chest",
        "spine"
      ],
      [
        "neck",
        "chest"
      ],
      [
        "head",
        "neck"
      ],
      [
        "jaw",
        "head"
      ],
      [
        "hindFarRoot",
        "pelvis"
      ],
      [
        "hindFarKnee",
        "hindFarRoot"
      ],
      [
        "hindFarAnkle",
        "hindFarKnee"
      ],
      [
        "hindFarPaw",
        "hindFarAnkle"
      ],
      [
        "foreFarRoot",
        "chest"
      ],
      [
        "foreFarKnee",
        "foreFarRoot"
      ],
      [
        "foreFarAnkle",
        "foreFarKnee"
      ],
      [
        "foreFarPaw",
        "foreFarAnkle"
      ],
      [
        "hindNearRoot",
        "pelvis"
      ],
      [
        "hindNearKnee",
        "hindNearRoot"
      ],
      [
        "hindNearAnkle",
        "hindNearKnee"
      ],
      [
        "hindNearPaw",
        "hindNearAnkle"
      ],
      [
        "foreNearRoot",
        "chest"
      ],
      [
        "foreNearKnee",
        "foreNearRoot"
      ],
      [
        "foreNearAnkle",
        "foreNearKnee"
      ],
      [
        "foreNearPaw",
        "foreNearAnkle"
      ],
      [
        "tail0",
        "pelvis"
      ],
      [
        "tail1",
        "tail0"
      ],
      [
        "tail2",
        "tail1"
      ],
      [
        "tail3",
        "tail2"
      ],
      [
        "earFarRoot",
        "head"
      ],
      [
        "earFarTip",
        "earFarRoot"
      ],
      [
        "earNearRoot",
        "head"
      ],
      [
        "earNearTip",
        "earNearRoot"
      ]
    ],
    "bodyAxis": [
      "pelvis",
      "chest"
    ],
    "joints": [
      "root",
      "pelvis",
      "spine",
      "chest",
      "neck",
      "head",
      "jaw",
      "hindFarRoot",
      "hindFarKnee",
      "hindFarAnkle",
      "hindFarPaw",
      "foreFarRoot",
      "foreFarKnee",
      "foreFarAnkle",
      "foreFarPaw",
      "hindNearRoot",
      "hindNearKnee",
      "hindNearAnkle",
      "hindNearPaw",
      "foreNearRoot",
      "foreNearKnee",
      "foreNearAnkle",
      "foreNearPaw",
      "tail0",
      "tail1",
      "tail2",
      "tail3",
      "earFarRoot",
      "earFarTip",
      "earNearRoot",
      "earNearTip"
    ],
    "legs": [
      "hindFar",
      "foreFar",
      "hindNear",
      "foreNear"
    ],
    "limitsDeg": {
      "root": {
        "min": -30,
        "max": 30
      },
      "pelvis": {
        "min": -25,
        "max": 25
      },
      "spine": {
        "min": -30,
        "max": 30
      },
      "chest": {
        "min": -20,
        "max": 20
      },
      "neck": {
        "min": -35,
        "max": 35
      },
      "head": {
        "min": -35,
        "max": 35
      },
      "jaw": {
        "min": -30,
        "max": 5
      },
      "hindFarRoot": {
        "min": -70,
        "max": 70
      },
      "hindFarKnee": {
        "min": -110,
        "max": 110
      },
      "hindFarAnkle": {
        "min": -110,
        "max": 110
      },
      "hindFarPaw": {
        "min": -45,
        "max": 45
      },
      "foreFarRoot": {
        "min": -60,
        "max": 60
      },
      "foreFarKnee": {
        "min": -75,
        "max": 75
      },
      "foreFarAnkle": {
        "min": -60,
        "max": 60
      },
      "foreFarPaw": {
        "min": -45,
        "max": 45
      },
      "hindNearRoot": {
        "min": -70,
        "max": 70
      },
      "hindNearKnee": {
        "min": -110,
        "max": 110
      },
      "hindNearAnkle": {
        "min": -110,
        "max": 110
      },
      "hindNearPaw": {
        "min": -45,
        "max": 45
      },
      "foreNearRoot": {
        "min": -60,
        "max": 60
      },
      "foreNearKnee": {
        "min": -75,
        "max": 75
      },
      "foreNearAnkle": {
        "min": -60,
        "max": 60
      },
      "foreNearPaw": {
        "min": -45,
        "max": 45
      },
      "tail0": {
        "min": -40,
        "max": 40
      },
      "tail1": {
        "min": -50,
        "max": 50
      },
      "tail2": {
        "min": -50,
        "max": 50
      },
      "tail3": {
        "min": -50,
        "max": 50
      },
      "earFarRoot": {
        "min": -30,
        "max": 30
      },
      "earFarTip": {
        "min": -40,
        "max": 40
      },
      "earNearRoot": {
        "min": -30,
        "max": 30
      },
      "earNearTip": {
        "min": -40,
        "max": 40
      }
    },
    "bounds": [
      {
        "id": "body",
        "min": 0.08,
        "max": 0.65,
        "kind": "distance",
        "axis": [
          "pelvis",
          "chest"
        ]
      },
      {
        "id": "bone-min",
        "min": 0.001,
        "max": 0.75,
        "kind": "bone-min"
      },
      {
        "id": "bone-max",
        "min": 0.001,
        "max": 0.75,
        "kind": "bone-max"
      },
      {
        "id": "leg/torso:hindFar",
        "min": 0.25,
        "max": 3.2,
        "kind": "ratio",
        "bones": [
          "hindFarKnee",
          "hindFarAnkle",
          "hindFarPaw"
        ],
        "axis": [
          "pelvis",
          "chest"
        ]
      },
      {
        "id": "leg/torso:foreFar",
        "min": 0.25,
        "max": 3.2,
        "kind": "ratio",
        "bones": [
          "foreFarKnee",
          "foreFarAnkle",
          "foreFarPaw"
        ],
        "axis": [
          "pelvis",
          "chest"
        ]
      },
      {
        "id": "leg/torso:hindNear",
        "min": 0.25,
        "max": 3.2,
        "kind": "ratio",
        "bones": [
          "hindNearKnee",
          "hindNearAnkle",
          "hindNearPaw"
        ],
        "axis": [
          "pelvis",
          "chest"
        ]
      },
      {
        "id": "leg/torso:foreNear",
        "min": 0.25,
        "max": 3.2,
        "kind": "ratio",
        "bones": [
          "foreNearKnee",
          "foreNearAnkle",
          "foreNearPaw"
        ],
        "axis": [
          "pelvis",
          "chest"
        ]
      }
    ]
  },
  {
    "id": "biped-bird",
    "version": 1,
    "clipSetId": "biped-bird-v1",
    "graph": [
      [
        "pelvis",
        "root"
      ],
      [
        "spine",
        "pelvis"
      ],
      [
        "chest",
        "spine"
      ],
      [
        "neck0",
        "chest"
      ],
      [
        "neck1",
        "neck0"
      ],
      [
        "head",
        "neck1"
      ],
      [
        "beak",
        "head"
      ],
      [
        "legFarKnee",
        "pelvis"
      ],
      [
        "legFarAnkle",
        "legFarKnee"
      ],
      [
        "legFarFoot",
        "legFarAnkle"
      ],
      [
        "legNearKnee",
        "pelvis"
      ],
      [
        "legNearAnkle",
        "legNearKnee"
      ],
      [
        "legNearFoot",
        "legNearAnkle"
      ],
      [
        "wingFarRoot",
        "chest"
      ],
      [
        "wingFarTip",
        "wingFarRoot"
      ],
      [
        "wingNearRoot",
        "chest"
      ],
      [
        "wingNearTip",
        "wingNearRoot"
      ],
      [
        "tailFan",
        "pelvis"
      ]
    ],
    "bodyAxis": [
      "pelvis",
      "chest"
    ],
    "joints": [
      "root",
      "pelvis",
      "spine",
      "chest",
      "neck0",
      "neck1",
      "head",
      "beak",
      "legFarKnee",
      "legFarAnkle",
      "legFarFoot",
      "legNearKnee",
      "legNearAnkle",
      "legNearFoot",
      "wingFarRoot",
      "wingFarTip",
      "wingNearRoot",
      "wingNearTip",
      "tailFan"
    ],
    "legs": [
      "legFar",
      "legNear"
    ],
    "limitsDeg": {
      "root": {
        "min": -25,
        "max": 25
      },
      "pelvis": {
        "min": -20,
        "max": 20
      },
      "spine": {
        "min": -25,
        "max": 25
      },
      "chest": {
        "min": -20,
        "max": 20
      },
      "neck0": {
        "min": -45,
        "max": 45
      },
      "neck1": {
        "min": -45,
        "max": 45
      },
      "head": {
        "min": -40,
        "max": 40
      },
      "beak": {
        "min": -30,
        "max": 5
      },
      "legFarKnee": {
        "min": -70,
        "max": 70
      },
      "legFarAnkle": {
        "min": -85,
        "max": 85
      },
      "legFarFoot": {
        "min": -45,
        "max": 45
      },
      "legNearKnee": {
        "min": -70,
        "max": 70
      },
      "legNearAnkle": {
        "min": -85,
        "max": 85
      },
      "legNearFoot": {
        "min": -45,
        "max": 45
      },
      "wingFarRoot": {
        "min": -60,
        "max": 95
      },
      "wingFarTip": {
        "min": -70,
        "max": 70
      },
      "wingNearRoot": {
        "min": -60,
        "max": 95
      },
      "wingNearTip": {
        "min": -70,
        "max": 70
      },
      "tailFan": {
        "min": -40,
        "max": 40
      }
    },
    "bounds": [
      {
        "id": "body",
        "min": 0.06,
        "max": 0.65,
        "kind": "distance",
        "axis": [
          "pelvis",
          "chest"
        ]
      },
      {
        "id": "bone-min",
        "min": 0.001,
        "max": 0.75,
        "kind": "bone-min"
      },
      {
        "id": "bone-max",
        "min": 0.001,
        "max": 0.75,
        "kind": "bone-max"
      },
      {
        "id": "leg/torso:legFar",
        "min": 0.3,
        "max": 3.5,
        "kind": "ratio",
        "bones": [
          "legFarKnee",
          "legFarAnkle",
          "legFarFoot"
        ],
        "axis": [
          "pelvis",
          "chest"
        ]
      },
      {
        "id": "leg/torso:legNear",
        "min": 0.3,
        "max": 3.5,
        "kind": "ratio",
        "bones": [
          "legNearKnee",
          "legNearAnkle",
          "legNearFoot"
        ],
        "axis": [
          "pelvis",
          "chest"
        ]
      },
      {
        "id": "wing/torso",
        "min": 0.4,
        "max": 4.5,
        "kind": "ratio",
        "bones": [
          "wingFarRoot",
          "wingFarTip"
        ],
        "axis": [
          "pelvis",
          "chest"
        ]
      }
    ]
  },
  {
    "id": "fish",
    "version": 1,
    "clipSetId": "fish-aquatic-v1",
    "graph": [
      [
        "head",
        "root"
      ],
      [
        "jaw",
        "head"
      ],
      [
        "spine0",
        "root"
      ],
      [
        "spine1",
        "spine0"
      ],
      [
        "spine2",
        "spine1"
      ],
      [
        "spine3",
        "spine2"
      ],
      [
        "spine4",
        "spine3"
      ],
      [
        "spine5",
        "spine4"
      ],
      [
        "caudal",
        "spine5"
      ],
      [
        "dorsal",
        "spine1"
      ],
      [
        "pectoralFar",
        "root"
      ],
      [
        "pectoralNear",
        "root"
      ]
    ],
    "bodyAxis": [
      "spine0",
      "spine5"
    ],
    "joints": [
      "root",
      "head",
      "jaw",
      "spine0",
      "spine1",
      "spine2",
      "spine3",
      "spine4",
      "spine5",
      "caudal",
      "dorsal",
      "pectoralFar",
      "pectoralNear"
    ],
    "legs": [],
    "limitsDeg": {
      "root": {
        "min": -30,
        "max": 30
      },
      "head": {
        "min": -30,
        "max": 30
      },
      "jaw": {
        "min": -35,
        "max": 5
      },
      "spine0": {
        "min": -35,
        "max": 35
      },
      "spine1": {
        "min": -35,
        "max": 35
      },
      "spine2": {
        "min": -35,
        "max": 35
      },
      "spine3": {
        "min": -35,
        "max": 35
      },
      "spine4": {
        "min": -35,
        "max": 35
      },
      "spine5": {
        "min": -35,
        "max": 35
      },
      "caudal": {
        "min": -50,
        "max": 50
      },
      "dorsal": {
        "min": -35,
        "max": 35
      },
      "pectoralFar": {
        "min": -60,
        "max": 60
      },
      "pectoralNear": {
        "min": -60,
        "max": 60
      }
    },
    "bounds": [
      {
        "id": "body",
        "min": 0.1,
        "max": 0.85,
        "kind": "distance",
        "axis": [
          "spine0",
          "spine5"
        ]
      },
      {
        "id": "bone-min",
        "min": 0.001,
        "max": 0.75,
        "kind": "bone-min"
      },
      {
        "id": "bone-max",
        "min": 0.001,
        "max": 0.75,
        "kind": "bone-max"
      },
      {
        "id": "caudal/body",
        "min": 0.05,
        "max": 0.9,
        "kind": "ratio",
        "bones": [
          "caudal"
        ],
        "axis": [
          "spine0",
          "spine5"
        ]
      },
      {
        "id": "head/body",
        "min": 0.04,
        "max": 0.8,
        "kind": "ratio",
        "bones": [
          "head"
        ],
        "axis": [
          "spine0",
          "spine5"
        ]
      }
    ]
  },
  {
    "id": "insect",
    "version": 1,
    "clipSetId": "insect-v1",
    "graph": [
      [
        "thorax",
        "root"
      ],
      [
        "head",
        "thorax"
      ],
      [
        "mandible",
        "head"
      ],
      [
        "abdomen",
        "thorax"
      ],
      [
        "legFrontFarKnee",
        "thorax"
      ],
      [
        "legFrontFarFoot",
        "legFrontFarKnee"
      ],
      [
        "legFrontNearKnee",
        "thorax"
      ],
      [
        "legFrontNearFoot",
        "legFrontNearKnee"
      ],
      [
        "legMidFarKnee",
        "thorax"
      ],
      [
        "legMidFarFoot",
        "legMidFarKnee"
      ],
      [
        "legMidNearKnee",
        "thorax"
      ],
      [
        "legMidNearFoot",
        "legMidNearKnee"
      ],
      [
        "legHindFarKnee",
        "thorax"
      ],
      [
        "legHindFarFoot",
        "legHindFarKnee"
      ],
      [
        "legHindNearKnee",
        "thorax"
      ],
      [
        "legHindNearFoot",
        "legHindNearKnee"
      ],
      [
        "antennaFar",
        "head"
      ],
      [
        "antennaNear",
        "head"
      ],
      [
        "wingFar",
        "thorax"
      ],
      [
        "wingNear",
        "thorax"
      ]
    ],
    "bodyAxis": [
      "abdomen",
      "head"
    ],
    "joints": [
      "root",
      "thorax",
      "head",
      "mandible",
      "abdomen",
      "legFrontFarKnee",
      "legFrontFarFoot",
      "legFrontNearKnee",
      "legFrontNearFoot",
      "legMidFarKnee",
      "legMidFarFoot",
      "legMidNearKnee",
      "legMidNearFoot",
      "legHindFarKnee",
      "legHindFarFoot",
      "legHindNearKnee",
      "legHindNearFoot",
      "antennaFar",
      "antennaNear",
      "wingFar",
      "wingNear"
    ],
    "legs": [
      "legFrontFar",
      "legFrontNear",
      "legMidFar",
      "legMidNear",
      "legHindFar",
      "legHindNear"
    ],
    "limitsDeg": {
      "root": {
        "min": -25,
        "max": 25
      },
      "thorax": {
        "min": -15,
        "max": 15
      },
      "head": {
        "min": -35,
        "max": 35
      },
      "mandible": {
        "min": -40,
        "max": 5
      },
      "abdomen": {
        "min": -35,
        "max": 50
      },
      "legFrontFarKnee": {
        "min": -65,
        "max": 65
      },
      "legFrontFarFoot": {
        "min": -75,
        "max": 75
      },
      "legFrontNearKnee": {
        "min": -65,
        "max": 65
      },
      "legFrontNearFoot": {
        "min": -75,
        "max": 75
      },
      "legMidFarKnee": {
        "min": -65,
        "max": 65
      },
      "legMidFarFoot": {
        "min": -75,
        "max": 75
      },
      "legMidNearKnee": {
        "min": -65,
        "max": 65
      },
      "legMidNearFoot": {
        "min": -75,
        "max": 75
      },
      "legHindFarKnee": {
        "min": -65,
        "max": 65
      },
      "legHindFarFoot": {
        "min": -75,
        "max": 75
      },
      "legHindNearKnee": {
        "min": -65,
        "max": 65
      },
      "legHindNearFoot": {
        "min": -75,
        "max": 75
      },
      "antennaFar": {
        "min": -50,
        "max": 50
      },
      "antennaNear": {
        "min": -50,
        "max": 50
      },
      "wingFar": {
        "min": -85,
        "max": 85
      },
      "wingNear": {
        "min": -85,
        "max": 85
      }
    },
    "bounds": [
      {
        "id": "body",
        "min": 0.08,
        "max": 0.85,
        "kind": "distance",
        "axis": [
          "abdomen",
          "head"
        ]
      },
      {
        "id": "bone-min",
        "min": 0.001,
        "max": 0.75,
        "kind": "bone-min"
      },
      {
        "id": "bone-max",
        "min": 0.001,
        "max": 0.75,
        "kind": "bone-max"
      },
      {
        "id": "leg/body:legFrontFar",
        "min": 0.1,
        "max": 2.5,
        "kind": "ratio",
        "bones": [
          "legFrontFarKnee",
          "legFrontFarFoot"
        ],
        "axis": [
          "abdomen",
          "head"
        ]
      },
      {
        "id": "leg/body:legFrontNear",
        "min": 0.1,
        "max": 2.5,
        "kind": "ratio",
        "bones": [
          "legFrontNearKnee",
          "legFrontNearFoot"
        ],
        "axis": [
          "abdomen",
          "head"
        ]
      },
      {
        "id": "leg/body:legMidFar",
        "min": 0.1,
        "max": 2.5,
        "kind": "ratio",
        "bones": [
          "legMidFarKnee",
          "legMidFarFoot"
        ],
        "axis": [
          "abdomen",
          "head"
        ]
      },
      {
        "id": "leg/body:legMidNear",
        "min": 0.1,
        "max": 2.5,
        "kind": "ratio",
        "bones": [
          "legMidNearKnee",
          "legMidNearFoot"
        ],
        "axis": [
          "abdomen",
          "head"
        ]
      },
      {
        "id": "leg/body:legHindFar",
        "min": 0.1,
        "max": 2.5,
        "kind": "ratio",
        "bones": [
          "legHindFarKnee",
          "legHindFarFoot"
        ],
        "axis": [
          "abdomen",
          "head"
        ]
      },
      {
        "id": "leg/body:legHindNear",
        "min": 0.1,
        "max": 2.5,
        "kind": "ratio",
        "bones": [
          "legHindNearKnee",
          "legHindNearFoot"
        ],
        "axis": [
          "abdomen",
          "head"
        ]
      }
    ]
  },
  {
    "id": "serpent",
    "version": 1,
    "clipSetId": "serpent-v1",
    "graph": [
      [
        "head",
        "root"
      ],
      [
        "jaw",
        "head"
      ],
      [
        "seg0",
        "root"
      ],
      [
        "seg1",
        "seg0"
      ],
      [
        "seg2",
        "seg1"
      ],
      [
        "seg3",
        "seg2"
      ],
      [
        "seg4",
        "seg3"
      ],
      [
        "seg5",
        "seg4"
      ],
      [
        "seg6",
        "seg5"
      ],
      [
        "seg7",
        "seg6"
      ],
      [
        "seg8",
        "seg7"
      ],
      [
        "seg9",
        "seg8"
      ]
    ],
    "bodyAxis": [
      "seg0",
      "seg9"
    ],
    "joints": [
      "root",
      "head",
      "jaw",
      "seg0",
      "seg1",
      "seg2",
      "seg3",
      "seg4",
      "seg5",
      "seg6",
      "seg7",
      "seg8",
      "seg9"
    ],
    "legs": [],
    "limitsDeg": {
      "root": {
        "min": -25,
        "max": 25
      },
      "head": {
        "min": -50,
        "max": 50
      },
      "jaw": {
        "min": -45,
        "max": 5
      },
      "seg0": {
        "min": -45,
        "max": 45
      },
      "seg1": {
        "min": -45,
        "max": 45
      },
      "seg2": {
        "min": -45,
        "max": 45
      },
      "seg3": {
        "min": -45,
        "max": 45
      },
      "seg4": {
        "min": -45,
        "max": 45
      },
      "seg5": {
        "min": -45,
        "max": 45
      },
      "seg6": {
        "min": -45,
        "max": 45
      },
      "seg7": {
        "min": -45,
        "max": 45
      },
      "seg8": {
        "min": -45,
        "max": 45
      },
      "seg9": {
        "min": -45,
        "max": 45
      }
    },
    "bounds": [
      {
        "id": "body",
        "min": 0.1,
        "max": 0.9,
        "kind": "distance",
        "axis": [
          "seg0",
          "seg9"
        ]
      },
      {
        "id": "bone-min",
        "min": 0.001,
        "max": 0.75,
        "kind": "bone-min"
      },
      {
        "id": "bone-max",
        "min": 0.001,
        "max": 0.75,
        "kind": "bone-max"
      },
      {
        "id": "head/body",
        "min": 0.02,
        "max": 0.5,
        "kind": "ratio",
        "bones": [
          "head"
        ],
        "axis": [
          "seg0",
          "seg9"
        ]
      }
    ]
  },
  {
    "id": "arachnid",
    "version": 1,
    "clipSetId": "arachnid-v1",
    "graph": [
      [
        "cephalothorax",
        "root"
      ],
      [
        "abdomen",
        "cephalothorax"
      ],
      [
        "sting",
        "abdomen"
      ],
      [
        "cheliceraFar",
        "cephalothorax"
      ],
      [
        "cheliceraNear",
        "cephalothorax"
      ],
      [
        "leg1FarKnee",
        "cephalothorax"
      ],
      [
        "leg1FarFoot",
        "leg1FarKnee"
      ],
      [
        "leg1NearKnee",
        "cephalothorax"
      ],
      [
        "leg1NearFoot",
        "leg1NearKnee"
      ],
      [
        "leg2FarKnee",
        "cephalothorax"
      ],
      [
        "leg2FarFoot",
        "leg2FarKnee"
      ],
      [
        "leg2NearKnee",
        "cephalothorax"
      ],
      [
        "leg2NearFoot",
        "leg2NearKnee"
      ],
      [
        "leg3FarKnee",
        "cephalothorax"
      ],
      [
        "leg3FarFoot",
        "leg3FarKnee"
      ],
      [
        "leg3NearKnee",
        "cephalothorax"
      ],
      [
        "leg3NearFoot",
        "leg3NearKnee"
      ],
      [
        "leg4FarKnee",
        "cephalothorax"
      ],
      [
        "leg4FarFoot",
        "leg4FarKnee"
      ],
      [
        "leg4NearKnee",
        "cephalothorax"
      ],
      [
        "leg4NearFoot",
        "leg4NearKnee"
      ]
    ],
    "bodyAxis": [
      "abdomen",
      "cephalothorax"
    ],
    "joints": [
      "root",
      "cephalothorax",
      "abdomen",
      "sting",
      "cheliceraFar",
      "cheliceraNear",
      "leg1FarKnee",
      "leg1FarFoot",
      "leg1NearKnee",
      "leg1NearFoot",
      "leg2FarKnee",
      "leg2FarFoot",
      "leg2NearKnee",
      "leg2NearFoot",
      "leg3FarKnee",
      "leg3FarFoot",
      "leg3NearKnee",
      "leg3NearFoot",
      "leg4FarKnee",
      "leg4FarFoot",
      "leg4NearKnee",
      "leg4NearFoot"
    ],
    "legs": [
      "leg1Far",
      "leg1Near",
      "leg2Far",
      "leg2Near",
      "leg3Far",
      "leg3Near",
      "leg4Far",
      "leg4Near"
    ],
    "limitsDeg": {
      "root": {
        "min": -25,
        "max": 25
      },
      "cephalothorax": {
        "min": -15,
        "max": 15
      },
      "abdomen": {
        "min": -35,
        "max": 65
      },
      "sting": {
        "min": -70,
        "max": 70
      },
      "cheliceraFar": {
        "min": -45,
        "max": 45
      },
      "cheliceraNear": {
        "min": -45,
        "max": 45
      },
      "leg1FarKnee": {
        "min": -65,
        "max": 65
      },
      "leg1FarFoot": {
        "min": -75,
        "max": 75
      },
      "leg1NearKnee": {
        "min": -65,
        "max": 65
      },
      "leg1NearFoot": {
        "min": -75,
        "max": 75
      },
      "leg2FarKnee": {
        "min": -65,
        "max": 65
      },
      "leg2FarFoot": {
        "min": -75,
        "max": 75
      },
      "leg2NearKnee": {
        "min": -65,
        "max": 65
      },
      "leg2NearFoot": {
        "min": -75,
        "max": 75
      },
      "leg3FarKnee": {
        "min": -65,
        "max": 65
      },
      "leg3FarFoot": {
        "min": -75,
        "max": 75
      },
      "leg3NearKnee": {
        "min": -65,
        "max": 65
      },
      "leg3NearFoot": {
        "min": -75,
        "max": 75
      },
      "leg4FarKnee": {
        "min": -65,
        "max": 65
      },
      "leg4FarFoot": {
        "min": -75,
        "max": 75
      },
      "leg4NearKnee": {
        "min": -65,
        "max": 65
      },
      "leg4NearFoot": {
        "min": -75,
        "max": 75
      }
    },
    "bounds": [
      {
        "id": "body",
        "min": 0.05,
        "max": 0.7,
        "kind": "distance",
        "axis": [
          "abdomen",
          "cephalothorax"
        ]
      },
      {
        "id": "bone-min",
        "min": 0.001,
        "max": 0.75,
        "kind": "bone-min"
      },
      {
        "id": "bone-max",
        "min": 0.001,
        "max": 0.75,
        "kind": "bone-max"
      },
      {
        "id": "leg/body:leg1Far",
        "min": 0.15,
        "max": 4,
        "kind": "ratio",
        "bones": [
          "leg1FarKnee",
          "leg1FarFoot"
        ],
        "axis": [
          "abdomen",
          "cephalothorax"
        ]
      },
      {
        "id": "leg/body:leg1Near",
        "min": 0.15,
        "max": 4,
        "kind": "ratio",
        "bones": [
          "leg1NearKnee",
          "leg1NearFoot"
        ],
        "axis": [
          "abdomen",
          "cephalothorax"
        ]
      },
      {
        "id": "leg/body:leg2Far",
        "min": 0.15,
        "max": 4,
        "kind": "ratio",
        "bones": [
          "leg2FarKnee",
          "leg2FarFoot"
        ],
        "axis": [
          "abdomen",
          "cephalothorax"
        ]
      },
      {
        "id": "leg/body:leg2Near",
        "min": 0.15,
        "max": 4,
        "kind": "ratio",
        "bones": [
          "leg2NearKnee",
          "leg2NearFoot"
        ],
        "axis": [
          "abdomen",
          "cephalothorax"
        ]
      },
      {
        "id": "leg/body:leg3Far",
        "min": 0.15,
        "max": 4,
        "kind": "ratio",
        "bones": [
          "leg3FarKnee",
          "leg3FarFoot"
        ],
        "axis": [
          "abdomen",
          "cephalothorax"
        ]
      },
      {
        "id": "leg/body:leg3Near",
        "min": 0.15,
        "max": 4,
        "kind": "ratio",
        "bones": [
          "leg3NearKnee",
          "leg3NearFoot"
        ],
        "axis": [
          "abdomen",
          "cephalothorax"
        ]
      },
      {
        "id": "leg/body:leg4Far",
        "min": 0.15,
        "max": 4,
        "kind": "ratio",
        "bones": [
          "leg4FarKnee",
          "leg4FarFoot"
        ],
        "axis": [
          "abdomen",
          "cephalothorax"
        ]
      },
      {
        "id": "leg/body:leg4Near",
        "min": 0.15,
        "max": 4,
        "kind": "ratio",
        "bones": [
          "leg4NearKnee",
          "leg4NearFoot"
        ],
        "axis": [
          "abdomen",
          "cephalothorax"
        ]
      }
    ]
  },
  {
    "id": "radial",
    "version": 1,
    "clipSetId": "radial-v1",
    "graph": [
      [
        "centre",
        "root"
      ],
      [
        "bell",
        "centre"
      ],
      [
        "arm0Seg0",
        "centre"
      ],
      [
        "arm0Seg1",
        "arm0Seg0"
      ],
      [
        "arm0Seg2",
        "arm0Seg1"
      ],
      [
        "arm1Seg0",
        "centre"
      ],
      [
        "arm1Seg1",
        "arm1Seg0"
      ],
      [
        "arm1Seg2",
        "arm1Seg1"
      ],
      [
        "arm2Seg0",
        "centre"
      ],
      [
        "arm2Seg1",
        "arm2Seg0"
      ],
      [
        "arm2Seg2",
        "arm2Seg1"
      ],
      [
        "arm3Seg0",
        "centre"
      ],
      [
        "arm3Seg1",
        "arm3Seg0"
      ],
      [
        "arm3Seg2",
        "arm3Seg1"
      ],
      [
        "arm4Seg0",
        "centre"
      ],
      [
        "arm4Seg1",
        "arm4Seg0"
      ],
      [
        "arm4Seg2",
        "arm4Seg1"
      ],
      [
        "arm5Seg0",
        "centre"
      ],
      [
        "arm5Seg1",
        "arm5Seg0"
      ],
      [
        "arm5Seg2",
        "arm5Seg1"
      ]
    ],
    "bodyAxis": [
      "centre",
      "bell"
    ],
    "joints": [
      "root",
      "centre",
      "bell",
      "arm0Seg0",
      "arm0Seg1",
      "arm0Seg2",
      "arm1Seg0",
      "arm1Seg1",
      "arm1Seg2",
      "arm2Seg0",
      "arm2Seg1",
      "arm2Seg2",
      "arm3Seg0",
      "arm3Seg1",
      "arm3Seg2",
      "arm4Seg0",
      "arm4Seg1",
      "arm4Seg2",
      "arm5Seg0",
      "arm5Seg1",
      "arm5Seg2"
    ],
    "legs": [],
    "limitsDeg": {
      "root": {
        "min": -35,
        "max": 35
      },
      "centre": {
        "min": -15,
        "max": 15
      },
      "bell": {
        "min": -25,
        "max": 25
      },
      "arm0Seg0": {
        "min": -45,
        "max": 45
      },
      "arm0Seg1": {
        "min": -55,
        "max": 55
      },
      "arm0Seg2": {
        "min": -55,
        "max": 55
      },
      "arm1Seg0": {
        "min": -45,
        "max": 45
      },
      "arm1Seg1": {
        "min": -55,
        "max": 55
      },
      "arm1Seg2": {
        "min": -55,
        "max": 55
      },
      "arm2Seg0": {
        "min": -45,
        "max": 45
      },
      "arm2Seg1": {
        "min": -55,
        "max": 55
      },
      "arm2Seg2": {
        "min": -55,
        "max": 55
      },
      "arm3Seg0": {
        "min": -45,
        "max": 45
      },
      "arm3Seg1": {
        "min": -55,
        "max": 55
      },
      "arm3Seg2": {
        "min": -55,
        "max": 55
      },
      "arm4Seg0": {
        "min": -45,
        "max": 45
      },
      "arm4Seg1": {
        "min": -55,
        "max": 55
      },
      "arm4Seg2": {
        "min": -55,
        "max": 55
      },
      "arm5Seg0": {
        "min": -45,
        "max": 45
      },
      "arm5Seg1": {
        "min": -55,
        "max": 55
      },
      "arm5Seg2": {
        "min": -55,
        "max": 55
      }
    },
    "bounds": [
      {
        "id": "body",
        "min": 0.03,
        "max": 0.6,
        "kind": "distance",
        "axis": [
          "centre",
          "bell"
        ]
      },
      {
        "id": "bone-min",
        "min": 0.001,
        "max": 0.75,
        "kind": "bone-min"
      },
      {
        "id": "bone-max",
        "min": 0.001,
        "max": 0.75,
        "kind": "bone-max"
      },
      {
        "id": "arm/bell:arm0",
        "min": 0.3,
        "max": 8,
        "kind": "ratio",
        "bones": [
          "arm0Seg0",
          "arm0Seg1",
          "arm0Seg2"
        ],
        "axis": [
          "centre",
          "bell"
        ]
      },
      {
        "id": "arm/bell:arm1",
        "min": 0.3,
        "max": 8,
        "kind": "ratio",
        "bones": [
          "arm1Seg0",
          "arm1Seg1",
          "arm1Seg2"
        ],
        "axis": [
          "centre",
          "bell"
        ]
      },
      {
        "id": "arm/bell:arm2",
        "min": 0.3,
        "max": 8,
        "kind": "ratio",
        "bones": [
          "arm2Seg0",
          "arm2Seg1",
          "arm2Seg2"
        ],
        "axis": [
          "centre",
          "bell"
        ]
      },
      {
        "id": "arm/bell:arm3",
        "min": 0.3,
        "max": 8,
        "kind": "ratio",
        "bones": [
          "arm3Seg0",
          "arm3Seg1",
          "arm3Seg2"
        ],
        "axis": [
          "centre",
          "bell"
        ]
      },
      {
        "id": "arm/bell:arm4",
        "min": 0.3,
        "max": 8,
        "kind": "ratio",
        "bones": [
          "arm4Seg0",
          "arm4Seg1",
          "arm4Seg2"
        ],
        "axis": [
          "centre",
          "bell"
        ]
      },
      {
        "id": "arm/bell:arm5",
        "min": 0.3,
        "max": 8,
        "kind": "ratio",
        "bones": [
          "arm5Seg0",
          "arm5Seg1",
          "arm5Seg2"
        ],
        "axis": [
          "centre",
          "bell"
        ]
      }
    ]
  },
  {
    "id": "plant-woody",
    "version": 1,
    "clipSetId": "plant-woody-v1",
    "graph": [
      [
        "trunk",
        "root"
      ],
      [
        "branch0Base",
        "trunk"
      ],
      [
        "branch0Tip",
        "branch0Base"
      ],
      [
        "leaf0",
        "branch0Tip"
      ],
      [
        "branch1Base",
        "trunk"
      ],
      [
        "branch1Tip",
        "branch1Base"
      ],
      [
        "leaf1",
        "branch1Tip"
      ],
      [
        "branch2Base",
        "trunk"
      ],
      [
        "branch2Tip",
        "branch2Base"
      ],
      [
        "leaf2",
        "branch2Tip"
      ]
    ],
    "bodyAxis": [
      "root",
      "trunk"
    ],
    "joints": [
      "root",
      "trunk",
      "branch0Base",
      "branch0Tip",
      "leaf0",
      "branch1Base",
      "branch1Tip",
      "leaf1",
      "branch2Base",
      "branch2Tip",
      "leaf2"
    ],
    "legs": [],
    "limitsDeg": {
      "root": {
        "min": -5,
        "max": 5
      },
      "trunk": {
        "min": -12,
        "max": 12
      },
      "branch0Base": {
        "min": -25,
        "max": 25
      },
      "branch0Tip": {
        "min": -35,
        "max": 35
      },
      "leaf0": {
        "min": -45,
        "max": 45
      },
      "branch1Base": {
        "min": -25,
        "max": 25
      },
      "branch1Tip": {
        "min": -35,
        "max": 35
      },
      "leaf1": {
        "min": -45,
        "max": 45
      },
      "branch2Base": {
        "min": -25,
        "max": 25
      },
      "branch2Tip": {
        "min": -35,
        "max": 35
      },
      "leaf2": {
        "min": -45,
        "max": 45
      }
    },
    "bounds": [
      {
        "id": "body",
        "min": 0.08,
        "max": 0.8,
        "kind": "distance",
        "axis": [
          "root",
          "trunk"
        ]
      },
      {
        "id": "bone-min",
        "min": 0.001,
        "max": 0.75,
        "kind": "bone-min"
      },
      {
        "id": "bone-max",
        "min": 0.001,
        "max": 0.75,
        "kind": "bone-max"
      },
      {
        "id": "branch/trunk:branch0",
        "min": 0.1,
        "max": 2.5,
        "kind": "ratio",
        "bones": [
          "branch0Base",
          "branch0Tip"
        ],
        "axis": [
          "root",
          "trunk"
        ]
      },
      {
        "id": "branch/trunk:branch1",
        "min": 0.1,
        "max": 2.5,
        "kind": "ratio",
        "bones": [
          "branch1Base",
          "branch1Tip"
        ],
        "axis": [
          "root",
          "trunk"
        ]
      },
      {
        "id": "branch/trunk:branch2",
        "min": 0.1,
        "max": 2.5,
        "kind": "ratio",
        "bones": [
          "branch2Base",
          "branch2Tip"
        ],
        "axis": [
          "root",
          "trunk"
        ]
      }
    ]
  },
  {
    "id": "plant-herb",
    "version": 1,
    "clipSetId": "plant-herb-v1",
    "graph": [
      [
        "stem0Seg0",
        "root"
      ],
      [
        "stem0Seg1",
        "stem0Seg0"
      ],
      [
        "stem0Seg2",
        "stem0Seg1"
      ],
      [
        "frond0",
        "stem0Seg2"
      ],
      [
        "stem1Seg0",
        "root"
      ],
      [
        "stem1Seg1",
        "stem1Seg0"
      ],
      [
        "stem1Seg2",
        "stem1Seg1"
      ],
      [
        "frond1",
        "stem1Seg2"
      ],
      [
        "stem2Seg0",
        "root"
      ],
      [
        "stem2Seg1",
        "stem2Seg0"
      ],
      [
        "stem2Seg2",
        "stem2Seg1"
      ],
      [
        "frond2",
        "stem2Seg2"
      ],
      [
        "stem3Seg0",
        "root"
      ],
      [
        "stem3Seg1",
        "stem3Seg0"
      ],
      [
        "stem3Seg2",
        "stem3Seg1"
      ],
      [
        "frond3",
        "stem3Seg2"
      ]
    ],
    "bodyAxis": [
      "stem0Seg0",
      "stem0Seg2"
    ],
    "joints": [
      "root",
      "stem0Seg0",
      "stem0Seg1",
      "stem0Seg2",
      "frond0",
      "stem1Seg0",
      "stem1Seg1",
      "stem1Seg2",
      "frond1",
      "stem2Seg0",
      "stem2Seg1",
      "stem2Seg2",
      "frond2",
      "stem3Seg0",
      "stem3Seg1",
      "stem3Seg2",
      "frond3"
    ],
    "legs": [],
    "limitsDeg": {
      "root": {
        "min": -5,
        "max": 5
      },
      "stem0Seg0": {
        "min": -25,
        "max": 25
      },
      "stem0Seg1": {
        "min": -40,
        "max": 40
      },
      "stem0Seg2": {
        "min": -40,
        "max": 40
      },
      "frond0": {
        "min": -50,
        "max": 50
      },
      "stem1Seg0": {
        "min": -25,
        "max": 25
      },
      "stem1Seg1": {
        "min": -40,
        "max": 40
      },
      "stem1Seg2": {
        "min": -40,
        "max": 40
      },
      "frond1": {
        "min": -50,
        "max": 50
      },
      "stem2Seg0": {
        "min": -25,
        "max": 25
      },
      "stem2Seg1": {
        "min": -40,
        "max": 40
      },
      "stem2Seg2": {
        "min": -40,
        "max": 40
      },
      "frond2": {
        "min": -50,
        "max": 50
      },
      "stem3Seg0": {
        "min": -25,
        "max": 25
      },
      "stem3Seg1": {
        "min": -40,
        "max": 40
      },
      "stem3Seg2": {
        "min": -40,
        "max": 40
      },
      "frond3": {
        "min": -50,
        "max": 50
      }
    },
    "bounds": [
      {
        "id": "body",
        "min": 0.04,
        "max": 0.8,
        "kind": "distance",
        "axis": [
          "stem0Seg0",
          "stem0Seg2"
        ]
      },
      {
        "id": "bone-min",
        "min": 0.001,
        "max": 0.75,
        "kind": "bone-min"
      },
      {
        "id": "bone-max",
        "min": 0.001,
        "max": 0.75,
        "kind": "bone-max"
      },
      {
        "id": "stem/stem0:stem0",
        "min": 0.2,
        "max": 4,
        "kind": "ratio",
        "bones": [
          "stem0Seg1",
          "stem0Seg2"
        ],
        "axis": [
          "stem0Seg0",
          "stem0Seg2"
        ]
      },
      {
        "id": "stem/stem0:stem1",
        "min": 0.2,
        "max": 4,
        "kind": "ratio",
        "bones": [
          "stem1Seg1",
          "stem1Seg2"
        ],
        "axis": [
          "stem0Seg0",
          "stem0Seg2"
        ]
      },
      {
        "id": "stem/stem0:stem2",
        "min": 0.2,
        "max": 4,
        "kind": "ratio",
        "bones": [
          "stem2Seg1",
          "stem2Seg2"
        ],
        "axis": [
          "stem0Seg0",
          "stem0Seg2"
        ]
      },
      {
        "id": "stem/stem0:stem3",
        "min": 0.2,
        "max": 4,
        "kind": "ratio",
        "bones": [
          "stem3Seg1",
          "stem3Seg2"
        ],
        "axis": [
          "stem0Seg0",
          "stem0Seg2"
        ]
      }
    ]
  },
  {
    "id": "myriapod",
    "version": 1,
    "clipSetId": "myriapod-v1",
    "graph": [
      [
        "head",
        "root"
      ],
      [
        "mandible",
        "head"
      ],
      [
        "seg0",
        "root"
      ],
      [
        "seg1",
        "seg0"
      ],
      [
        "seg2",
        "seg1"
      ],
      [
        "seg3",
        "seg2"
      ],
      [
        "seg4",
        "seg3"
      ],
      [
        "seg5",
        "seg4"
      ],
      [
        "seg6",
        "seg5"
      ],
      [
        "seg7",
        "seg6"
      ],
      [
        "legAFarKnee",
        "seg0"
      ],
      [
        "legAFarFoot",
        "legAFarKnee"
      ],
      [
        "legANearKnee",
        "seg0"
      ],
      [
        "legANearFoot",
        "legANearKnee"
      ],
      [
        "legBFarKnee",
        "seg2"
      ],
      [
        "legBFarFoot",
        "legBFarKnee"
      ],
      [
        "legBNearKnee",
        "seg2"
      ],
      [
        "legBNearFoot",
        "legBNearKnee"
      ],
      [
        "legCFarKnee",
        "seg4"
      ],
      [
        "legCFarFoot",
        "legCFarKnee"
      ],
      [
        "legCNearKnee",
        "seg4"
      ],
      [
        "legCNearFoot",
        "legCNearKnee"
      ],
      [
        "legDFarKnee",
        "seg6"
      ],
      [
        "legDFarFoot",
        "legDFarKnee"
      ],
      [
        "legDNearKnee",
        "seg6"
      ],
      [
        "legDNearFoot",
        "legDNearKnee"
      ],
      [
        "antennaFar",
        "head"
      ],
      [
        "antennaNear",
        "head"
      ]
    ],
    "bodyAxis": [
      "seg7",
      "head"
    ],
    "joints": [
      "root",
      "head",
      "mandible",
      "seg0",
      "seg1",
      "seg2",
      "seg3",
      "seg4",
      "seg5",
      "seg6",
      "seg7",
      "legAFarKnee",
      "legAFarFoot",
      "legANearKnee",
      "legANearFoot",
      "legBFarKnee",
      "legBFarFoot",
      "legBNearKnee",
      "legBNearFoot",
      "legCFarKnee",
      "legCFarFoot",
      "legCNearKnee",
      "legCNearFoot",
      "legDFarKnee",
      "legDFarFoot",
      "legDNearKnee",
      "legDNearFoot",
      "antennaFar",
      "antennaNear"
    ],
    "legs": [
      "legAFar",
      "legANear",
      "legBFar",
      "legBNear",
      "legCFar",
      "legCNear",
      "legDFar",
      "legDNear"
    ],
    "limitsDeg": {
      "root": {
        "min": -20,
        "max": 20
      },
      "head": {
        "min": -35,
        "max": 35
      },
      "mandible": {
        "min": -40,
        "max": 5
      },
      "seg0": {
        "min": -35,
        "max": 35
      },
      "seg1": {
        "min": -35,
        "max": 35
      },
      "seg2": {
        "min": -35,
        "max": 35
      },
      "seg3": {
        "min": -35,
        "max": 35
      },
      "seg4": {
        "min": -60,
        "max": 60
      },
      "seg5": {
        "min": -60,
        "max": 60
      },
      "seg6": {
        "min": -60,
        "max": 60
      },
      "seg7": {
        "min": -60,
        "max": 60
      },
      "legAFarKnee": {
        "min": -60,
        "max": 60
      },
      "legAFarFoot": {
        "min": -70,
        "max": 70
      },
      "legANearKnee": {
        "min": -60,
        "max": 60
      },
      "legANearFoot": {
        "min": -70,
        "max": 70
      },
      "legBFarKnee": {
        "min": -60,
        "max": 60
      },
      "legBFarFoot": {
        "min": -70,
        "max": 70
      },
      "legBNearKnee": {
        "min": -60,
        "max": 60
      },
      "legBNearFoot": {
        "min": -70,
        "max": 70
      },
      "legCFarKnee": {
        "min": -60,
        "max": 60
      },
      "legCFarFoot": {
        "min": -70,
        "max": 70
      },
      "legCNearKnee": {
        "min": -60,
        "max": 60
      },
      "legCNearFoot": {
        "min": -70,
        "max": 70
      },
      "legDFarKnee": {
        "min": -60,
        "max": 60
      },
      "legDFarFoot": {
        "min": -70,
        "max": 70
      },
      "legDNearKnee": {
        "min": -60,
        "max": 60
      },
      "legDNearFoot": {
        "min": -70,
        "max": 70
      },
      "antennaFar": {
        "min": -50,
        "max": 50
      },
      "antennaNear": {
        "min": -50,
        "max": 50
      }
    },
    "bounds": [
      {
        "id": "body",
        "min": 0.1,
        "max": 0.95,
        "kind": "distance",
        "axis": [
          "seg7",
          "head"
        ]
      },
      {
        "id": "bone-min",
        "min": 0.001,
        "max": 0.75,
        "kind": "bone-min"
      },
      {
        "id": "bone-max",
        "min": 0.001,
        "max": 0.75,
        "kind": "bone-max"
      },
      {
        "id": "leg/body:legAFar",
        "min": 0.05,
        "max": 1.5,
        "kind": "ratio",
        "bones": [
          "legAFarKnee",
          "legAFarFoot"
        ],
        "axis": [
          "seg7",
          "head"
        ]
      },
      {
        "id": "leg/body:legANear",
        "min": 0.05,
        "max": 1.5,
        "kind": "ratio",
        "bones": [
          "legANearKnee",
          "legANearFoot"
        ],
        "axis": [
          "seg7",
          "head"
        ]
      },
      {
        "id": "leg/body:legBFar",
        "min": 0.05,
        "max": 1.5,
        "kind": "ratio",
        "bones": [
          "legBFarKnee",
          "legBFarFoot"
        ],
        "axis": [
          "seg7",
          "head"
        ]
      },
      {
        "id": "leg/body:legBNear",
        "min": 0.05,
        "max": 1.5,
        "kind": "ratio",
        "bones": [
          "legBNearKnee",
          "legBNearFoot"
        ],
        "axis": [
          "seg7",
          "head"
        ]
      },
      {
        "id": "leg/body:legCFar",
        "min": 0.05,
        "max": 1.5,
        "kind": "ratio",
        "bones": [
          "legCFarKnee",
          "legCFarFoot"
        ],
        "axis": [
          "seg7",
          "head"
        ]
      },
      {
        "id": "leg/body:legCNear",
        "min": 0.05,
        "max": 1.5,
        "kind": "ratio",
        "bones": [
          "legCNearKnee",
          "legCNearFoot"
        ],
        "axis": [
          "seg7",
          "head"
        ]
      },
      {
        "id": "leg/body:legDFar",
        "min": 0.05,
        "max": 1.5,
        "kind": "ratio",
        "bones": [
          "legDFarKnee",
          "legDFarFoot"
        ],
        "axis": [
          "seg7",
          "head"
        ]
      },
      {
        "id": "leg/body:legDNear",
        "min": 0.05,
        "max": 1.5,
        "kind": "ratio",
        "bones": [
          "legDNearKnee",
          "legDNearFoot"
        ],
        "axis": [
          "seg7",
          "head"
        ]
      }
    ]
  },
  {
    "id": "cephalopod",
    "version": 1,
    "clipSetId": "cephalopod-v1",
    "graph": [
      [
        "mantle",
        "root"
      ],
      [
        "head",
        "root"
      ],
      [
        "eyeFar",
        "head"
      ],
      [
        "eyeNear",
        "head"
      ],
      [
        "siphon",
        "head"
      ],
      [
        "finFar",
        "mantle"
      ],
      [
        "finNear",
        "mantle"
      ],
      [
        "arm0Seg0",
        "head"
      ],
      [
        "arm0Seg1",
        "arm0Seg0"
      ],
      [
        "arm0Seg2",
        "arm0Seg1"
      ],
      [
        "arm1Seg0",
        "head"
      ],
      [
        "arm1Seg1",
        "arm1Seg0"
      ],
      [
        "arm1Seg2",
        "arm1Seg1"
      ],
      [
        "arm2Seg0",
        "head"
      ],
      [
        "arm2Seg1",
        "arm2Seg0"
      ],
      [
        "arm2Seg2",
        "arm2Seg1"
      ],
      [
        "arm3Seg0",
        "head"
      ],
      [
        "arm3Seg1",
        "arm3Seg0"
      ],
      [
        "arm3Seg2",
        "arm3Seg1"
      ],
      [
        "arm4Seg0",
        "head"
      ],
      [
        "arm4Seg1",
        "arm4Seg0"
      ],
      [
        "arm4Seg2",
        "arm4Seg1"
      ],
      [
        "arm5Seg0",
        "head"
      ],
      [
        "arm5Seg1",
        "arm5Seg0"
      ],
      [
        "arm5Seg2",
        "arm5Seg1"
      ],
      [
        "arm6Seg0",
        "head"
      ],
      [
        "arm6Seg1",
        "arm6Seg0"
      ],
      [
        "arm6Seg2",
        "arm6Seg1"
      ],
      [
        "arm7Seg0",
        "head"
      ],
      [
        "arm7Seg1",
        "arm7Seg0"
      ],
      [
        "arm7Seg2",
        "arm7Seg1"
      ]
    ],
    "bodyAxis": [
      "head",
      "mantle"
    ],
    "joints": [
      "root",
      "mantle",
      "head",
      "eyeFar",
      "eyeNear",
      "siphon",
      "finFar",
      "finNear",
      "arm0Seg0",
      "arm0Seg1",
      "arm0Seg2",
      "arm1Seg0",
      "arm1Seg1",
      "arm1Seg2",
      "arm2Seg0",
      "arm2Seg1",
      "arm2Seg2",
      "arm3Seg0",
      "arm3Seg1",
      "arm3Seg2",
      "arm4Seg0",
      "arm4Seg1",
      "arm4Seg2",
      "arm5Seg0",
      "arm5Seg1",
      "arm5Seg2",
      "arm6Seg0",
      "arm6Seg1",
      "arm6Seg2",
      "arm7Seg0",
      "arm7Seg1",
      "arm7Seg2"
    ],
    "legs": [],
    "limitsDeg": {
      "root": {
        "min": -30,
        "max": 30
      },
      "mantle": {
        "min": -25,
        "max": 25
      },
      "head": {
        "min": -30,
        "max": 30
      },
      "eyeFar": {
        "min": -20,
        "max": 20
      },
      "eyeNear": {
        "min": -20,
        "max": 20
      },
      "siphon": {
        "min": -45,
        "max": 45
      },
      "finFar": {
        "min": -40,
        "max": 40
      },
      "finNear": {
        "min": -40,
        "max": 40
      },
      "arm0Seg0": {
        "min": -55,
        "max": 55
      },
      "arm0Seg1": {
        "min": -70,
        "max": 70
      },
      "arm0Seg2": {
        "min": -80,
        "max": 80
      },
      "arm1Seg0": {
        "min": -55,
        "max": 55
      },
      "arm1Seg1": {
        "min": -70,
        "max": 70
      },
      "arm1Seg2": {
        "min": -80,
        "max": 80
      },
      "arm2Seg0": {
        "min": -55,
        "max": 55
      },
      "arm2Seg1": {
        "min": -70,
        "max": 70
      },
      "arm2Seg2": {
        "min": -80,
        "max": 80
      },
      "arm3Seg0": {
        "min": -55,
        "max": 55
      },
      "arm3Seg1": {
        "min": -70,
        "max": 70
      },
      "arm3Seg2": {
        "min": -80,
        "max": 80
      },
      "arm4Seg0": {
        "min": -55,
        "max": 55
      },
      "arm4Seg1": {
        "min": -70,
        "max": 70
      },
      "arm4Seg2": {
        "min": -80,
        "max": 80
      },
      "arm5Seg0": {
        "min": -55,
        "max": 55
      },
      "arm5Seg1": {
        "min": -70,
        "max": 70
      },
      "arm5Seg2": {
        "min": -80,
        "max": 80
      },
      "arm6Seg0": {
        "min": -55,
        "max": 55
      },
      "arm6Seg1": {
        "min": -70,
        "max": 70
      },
      "arm6Seg2": {
        "min": -80,
        "max": 80
      },
      "arm7Seg0": {
        "min": -55,
        "max": 55
      },
      "arm7Seg1": {
        "min": -70,
        "max": 70
      },
      "arm7Seg2": {
        "min": -80,
        "max": 80
      }
    },
    "bounds": [
      {
        "id": "body",
        "min": 0.05,
        "max": 0.7,
        "kind": "distance",
        "axis": [
          "head",
          "mantle"
        ]
      },
      {
        "id": "bone-min",
        "min": 0.001,
        "max": 0.75,
        "kind": "bone-min"
      },
      {
        "id": "bone-max",
        "min": 0.001,
        "max": 0.75,
        "kind": "bone-max"
      },
      {
        "id": "arm/body:arm0",
        "min": 0.3,
        "max": 6,
        "kind": "ratio",
        "bones": [
          "arm0Seg0",
          "arm0Seg1",
          "arm0Seg2"
        ],
        "axis": [
          "head",
          "mantle"
        ]
      },
      {
        "id": "arm/body:arm1",
        "min": 0.3,
        "max": 6,
        "kind": "ratio",
        "bones": [
          "arm1Seg0",
          "arm1Seg1",
          "arm1Seg2"
        ],
        "axis": [
          "head",
          "mantle"
        ]
      },
      {
        "id": "arm/body:arm2",
        "min": 0.3,
        "max": 6,
        "kind": "ratio",
        "bones": [
          "arm2Seg0",
          "arm2Seg1",
          "arm2Seg2"
        ],
        "axis": [
          "head",
          "mantle"
        ]
      },
      {
        "id": "arm/body:arm3",
        "min": 0.3,
        "max": 6,
        "kind": "ratio",
        "bones": [
          "arm3Seg0",
          "arm3Seg1",
          "arm3Seg2"
        ],
        "axis": [
          "head",
          "mantle"
        ]
      },
      {
        "id": "arm/body:arm4",
        "min": 0.3,
        "max": 6,
        "kind": "ratio",
        "bones": [
          "arm4Seg0",
          "arm4Seg1",
          "arm4Seg2"
        ],
        "axis": [
          "head",
          "mantle"
        ]
      },
      {
        "id": "arm/body:arm5",
        "min": 0.3,
        "max": 6,
        "kind": "ratio",
        "bones": [
          "arm5Seg0",
          "arm5Seg1",
          "arm5Seg2"
        ],
        "axis": [
          "head",
          "mantle"
        ]
      },
      {
        "id": "arm/body:arm6",
        "min": 0.3,
        "max": 6,
        "kind": "ratio",
        "bones": [
          "arm6Seg0",
          "arm6Seg1",
          "arm6Seg2"
        ],
        "axis": [
          "head",
          "mantle"
        ]
      },
      {
        "id": "arm/body:arm7",
        "min": 0.3,
        "max": 6,
        "kind": "ratio",
        "bones": [
          "arm7Seg0",
          "arm7Seg1",
          "arm7Seg2"
        ],
        "axis": [
          "head",
          "mantle"
        ]
      }
    ]
  },
  {
    "id": "flyer-membrane",
    "version": 1,
    "clipSetId": "flyer-membrane-v1",
    "graph": [
      [
        "pelvis",
        "root"
      ],
      [
        "spine",
        "pelvis"
      ],
      [
        "chest",
        "spine"
      ],
      [
        "neck",
        "chest"
      ],
      [
        "head",
        "neck"
      ],
      [
        "jaw",
        "head"
      ],
      [
        "wingFarRoot",
        "chest"
      ],
      [
        "wingFarElbow",
        "wingFarRoot"
      ],
      [
        "wingFarWrist",
        "wingFarElbow"
      ],
      [
        "wingFarTip",
        "wingFarWrist"
      ],
      [
        "wingNearRoot",
        "chest"
      ],
      [
        "wingNearElbow",
        "wingNearRoot"
      ],
      [
        "wingNearWrist",
        "wingNearElbow"
      ],
      [
        "wingNearTip",
        "wingNearWrist"
      ],
      [
        "legFarKnee",
        "pelvis"
      ],
      [
        "legFarFoot",
        "legFarKnee"
      ],
      [
        "legNearKnee",
        "pelvis"
      ],
      [
        "legNearFoot",
        "legNearKnee"
      ],
      [
        "earFarTip",
        "head"
      ],
      [
        "earNearTip",
        "head"
      ],
      [
        "tail0",
        "pelvis"
      ]
    ],
    "bodyAxis": [
      "pelvis",
      "chest"
    ],
    "joints": [
      "root",
      "pelvis",
      "spine",
      "chest",
      "neck",
      "head",
      "jaw",
      "wingFarRoot",
      "wingFarElbow",
      "wingFarWrist",
      "wingFarTip",
      "wingNearRoot",
      "wingNearElbow",
      "wingNearWrist",
      "wingNearTip",
      "legFarKnee",
      "legFarFoot",
      "legNearKnee",
      "legNearFoot",
      "earFarTip",
      "earNearTip",
      "tail0"
    ],
    "legs": [
      "legFar",
      "legNear"
    ],
    "limitsDeg": {
      "root": {
        "min": -35,
        "max": 35
      },
      "pelvis": {
        "min": -20,
        "max": 20
      },
      "spine": {
        "min": -25,
        "max": 25
      },
      "chest": {
        "min": -20,
        "max": 20
      },
      "neck": {
        "min": -35,
        "max": 35
      },
      "head": {
        "min": -40,
        "max": 40
      },
      "jaw": {
        "min": -40,
        "max": 5
      },
      "wingFarRoot": {
        "min": -80,
        "max": 100
      },
      "wingFarElbow": {
        "min": -90,
        "max": 90
      },
      "wingFarWrist": {
        "min": -80,
        "max": 80
      },
      "wingFarTip": {
        "min": -70,
        "max": 70
      },
      "wingNearRoot": {
        "min": -80,
        "max": 100
      },
      "wingNearElbow": {
        "min": -90,
        "max": 90
      },
      "wingNearWrist": {
        "min": -80,
        "max": 80
      },
      "wingNearTip": {
        "min": -70,
        "max": 70
      },
      "legFarKnee": {
        "min": -70,
        "max": 70
      },
      "legFarFoot": {
        "min": -60,
        "max": 60
      },
      "legNearKnee": {
        "min": -70,
        "max": 70
      },
      "legNearFoot": {
        "min": -60,
        "max": 60
      },
      "earFarTip": {
        "min": -40,
        "max": 40
      },
      "earNearTip": {
        "min": -40,
        "max": 40
      },
      "tail0": {
        "min": -45,
        "max": 45
      }
    },
    "bounds": [
      {
        "id": "body",
        "min": 0.05,
        "max": 0.6,
        "kind": "distance",
        "axis": [
          "pelvis",
          "chest"
        ]
      },
      {
        "id": "bone-min",
        "min": 0.001,
        "max": 0.75,
        "kind": "bone-min"
      },
      {
        "id": "bone-max",
        "min": 0.001,
        "max": 0.75,
        "kind": "bone-max"
      },
      {
        "id": "wing/torso:wingFar",
        "min": 0.8,
        "max": 12,
        "kind": "ratio",
        "bones": [
          "wingFarRoot",
          "wingFarElbow",
          "wingFarWrist",
          "wingFarTip"
        ],
        "axis": [
          "pelvis",
          "chest"
        ]
      },
      {
        "id": "wing/torso:wingNear",
        "min": 0.8,
        "max": 12,
        "kind": "ratio",
        "bones": [
          "wingNearRoot",
          "wingNearElbow",
          "wingNearWrist",
          "wingNearTip"
        ],
        "axis": [
          "pelvis",
          "chest"
        ]
      },
      {
        "id": "leg/torso:legFar",
        "min": 0.2,
        "max": 4,
        "kind": "ratio",
        "bones": [
          "legFarKnee",
          "legFarFoot"
        ],
        "axis": [
          "pelvis",
          "chest"
        ]
      },
      {
        "id": "leg/torso:legNear",
        "min": 0.2,
        "max": 4,
        "kind": "ratio",
        "bones": [
          "legNearKnee",
          "legNearFoot"
        ],
        "axis": [
          "pelvis",
          "chest"
        ]
      }
    ]
  },
  {
    "id": "primate",
    "version": 1,
    "clipSetId": "primate-v1",
    "graph": [
      [
        "pelvis",
        "root"
      ],
      [
        "spine",
        "pelvis"
      ],
      [
        "chest",
        "spine"
      ],
      [
        "neck",
        "chest"
      ],
      [
        "head",
        "neck"
      ],
      [
        "jaw",
        "head"
      ],
      [
        "armFarShoulder",
        "chest"
      ],
      [
        "armFarElbow",
        "armFarShoulder"
      ],
      [
        "armFarHand",
        "armFarElbow"
      ],
      [
        "armNearShoulder",
        "chest"
      ],
      [
        "armNearElbow",
        "armNearShoulder"
      ],
      [
        "armNearHand",
        "armNearElbow"
      ],
      [
        "legFarHip",
        "pelvis"
      ],
      [
        "legFarKnee",
        "legFarHip"
      ],
      [
        "legFarFoot",
        "legFarKnee"
      ],
      [
        "legNearHip",
        "pelvis"
      ],
      [
        "legNearKnee",
        "legNearHip"
      ],
      [
        "legNearFoot",
        "legNearKnee"
      ],
      [
        "tail0",
        "pelvis"
      ],
      [
        "tail1",
        "tail0"
      ],
      [
        "tail2",
        "tail1"
      ]
    ],
    "bodyAxis": [
      "pelvis",
      "chest"
    ],
    "joints": [
      "root",
      "pelvis",
      "spine",
      "chest",
      "neck",
      "head",
      "jaw",
      "armFarShoulder",
      "armFarElbow",
      "armFarHand",
      "armNearShoulder",
      "armNearElbow",
      "armNearHand",
      "legFarHip",
      "legFarKnee",
      "legFarFoot",
      "legNearHip",
      "legNearKnee",
      "legNearFoot",
      "tail0",
      "tail1",
      "tail2"
    ],
    "legs": [
      "legFar",
      "legNear"
    ],
    "limitsDeg": {
      "root": {
        "min": -30,
        "max": 30
      },
      "pelvis": {
        "min": -25,
        "max": 25
      },
      "spine": {
        "min": -30,
        "max": 30
      },
      "chest": {
        "min": -25,
        "max": 25
      },
      "neck": {
        "min": -35,
        "max": 35
      },
      "head": {
        "min": -40,
        "max": 40
      },
      "jaw": {
        "min": -35,
        "max": 5
      },
      "armFarShoulder": {
        "min": -100,
        "max": 100
      },
      "armFarElbow": {
        "min": -110,
        "max": 110
      },
      "armFarHand": {
        "min": -60,
        "max": 60
      },
      "armNearShoulder": {
        "min": -100,
        "max": 100
      },
      "armNearElbow": {
        "min": -110,
        "max": 110
      },
      "armNearHand": {
        "min": -60,
        "max": 60
      },
      "legFarHip": {
        "min": -80,
        "max": 80
      },
      "legFarKnee": {
        "min": -110,
        "max": 110
      },
      "legFarFoot": {
        "min": -50,
        "max": 50
      },
      "legNearHip": {
        "min": -80,
        "max": 80
      },
      "legNearKnee": {
        "min": -110,
        "max": 110
      },
      "legNearFoot": {
        "min": -50,
        "max": 50
      },
      "tail0": {
        "min": -40,
        "max": 40
      },
      "tail1": {
        "min": -50,
        "max": 50
      },
      "tail2": {
        "min": -50,
        "max": 50
      }
    },
    "bounds": [
      {
        "id": "body",
        "min": 0.06,
        "max": 0.6,
        "kind": "distance",
        "axis": [
          "pelvis",
          "chest"
        ]
      },
      {
        "id": "bone-min",
        "min": 0.001,
        "max": 0.75,
        "kind": "bone-min"
      },
      {
        "id": "bone-max",
        "min": 0.001,
        "max": 0.75,
        "kind": "bone-max"
      },
      {
        "id": "arm/torso:armFar",
        "min": 0.5,
        "max": 4,
        "kind": "ratio",
        "bones": [
          "armFarShoulder",
          "armFarElbow",
          "armFarHand"
        ],
        "axis": [
          "pelvis",
          "chest"
        ]
      },
      {
        "id": "arm/torso:armNear",
        "min": 0.5,
        "max": 4,
        "kind": "ratio",
        "bones": [
          "armNearShoulder",
          "armNearElbow",
          "armNearHand"
        ],
        "axis": [
          "pelvis",
          "chest"
        ]
      },
      {
        "id": "leg/torso:legFar",
        "min": 0.5,
        "max": 4,
        "kind": "ratio",
        "bones": [
          "legFarHip",
          "legFarKnee",
          "legFarFoot"
        ],
        "axis": [
          "pelvis",
          "chest"
        ]
      },
      {
        "id": "leg/torso:legNear",
        "min": 0.5,
        "max": 4,
        "kind": "ratio",
        "bones": [
          "legNearHip",
          "legNearKnee",
          "legNearFoot"
        ],
        "axis": [
          "pelvis",
          "chest"
        ]
      }
    ]
  }
];
const freeze=x=>{if(x&&typeof x==='object'){for(const v of Object.values(x))freeze(v);Object.freeze(x);}return x;};
// Shared stance ownership: default preserves the historical all-chain solve.
contracts.find(t=>t.id==='quadruped').contactStance={default:'all',gaits:{'approach:walk':'alternating','approach:trot':'alternating','approach:gallop':'bounding'},actions:{idle:'all',alert:'all',hit:'all',feed:'all',tame:'all',faint:'all',approach:'all','melee:*':'hind',cast:'hind',victory:'hind',dodge:'none','melee:kick':'none'}};
// Insect source clips explicitly rear onto the hind pair for cast/victory,
// tuck all six legs for the dodge hop, and step through hit/tame root travel.
// Contact inventory is semantic; no numerical authoring/contact limit changes.
contracts.find(t=>t.id==='insect').contactStance={default:'all',actions:{cast:'hind',victory:'hind',dodge:'none'},travel:{hit:'source-steps',tame:'source-steps'}};
// Hopper bite/cast/victory raise the forelegs; dodge is an aerial recoil.
// Faint and ordinary stance retain all contacts and the existing limits.
contracts.find(t=>t.id==='hopper').contactStance={default:'all',actions:{'melee:bite':'hind',cast:'hind',victory:'hind',dodge:'none'},travel:{hit:'source-steps',tame:'source-steps'}};
// Primate's bilateral leg tuck follows the existing unplanted stage dodge;
// ordinary stance and faint retain both feet and all numerical limits.
contracts.find(t=>t.id==='primate').contactStance={default:'all',actions:{dodge:'none'}};
// Arachnid casts rear on the posterior two pairs; the shared source-step
// planner uses the graph's existing alternating tetrapods for hit/tame travel.
contracts.find(t=>t.id==='arachnid').contactStance={default:'all',hind:['leg3Far','leg3Near','leg4Far','leg4Near'],actions:{cast:'hind',victory:'hind',dodge:'none'},travel:{hit:'source-steps',tame:'source-steps'}};
// R3-S planted-fold ledger: max |Knee|86.5369, |Ankle|94.1469,
// |Paw|80.5685 degrees; +10 then ceil to5. Raw authoring limits unchanged.
const quadrupedContact=contracts.find(t=>t.id==='quadruped');
quadrupedContact.contactLimitsDeg={...quadrupedContact.limitsDeg,...Object.fromEntries(quadrupedContact.legs.flatMap(id=>Object.entries({Knee:100,Ankle:105,Paw:95}).map(([joint,max])=>[id+joint,{min:-max,max}])))};
export const FAMILY_CONTRACTS = freeze(contracts);
export function contactStanceForAction(template,actionId){const c=template.contactStance;return c?.actions?.[actionId]??c?.actions?.[actionId.split(':')[0]+':*']??c?.default??'all';}
export function familyContract(id){const value=SPECIALIZED_TEMPLATES[id]??FAMILY_CONTRACTS.find(t=>t.id===id);if(!value)throw Error('Family admission: unknown template '+id);return value.id==='brachyuran'?freeze({...value,contactStance:{default:'all',actions:{}},contactLimitsDeg:{...value.limitsDeg,...Object.fromEntries(value.legs.flatMap(id=>Object.entries({Knee:75,Foot:105}).map(([joint,max])=>[id+joint,{min:-max,max}])) )}}):value;}

export function familyContractForRecord(record){return projectTemplateLimits(resolveAnatomyInventory(familyContract(record.template.id),record.anatomy),record);}

/** Declared leg-chain convention, resolved only within a template's own graph.
 * No landmark search and no fabricated joints. Terminal paint is independent
 * from the two-bone endpoint (Ankle→Paw/Foot versus Knee→Foot). */
export function familyContactChains(template){
 const parents=new Map(template.graph),out=[];
 for(const [i,id]of template.legs.entries()){
  if(template.hiddenChains?.includes(id))continue;
  const knee=id+'Knee',ankle=id+'Ankle',foot=id+'Foot',end=parents.has(ankle)?ankle:foot;
  const hip=parents.get(knee),terminal=parents.has(id+'Paw')?id+'Paw':end===ankle&&parents.has(foot)?foot:null;
  if(!hip||parents.get(end)!==knee||(terminal&&parents.get(terminal)!==end))throw Error('Contact contract: unsupported leg '+id);
  out.push(Object.freeze({id,hip,knee,end,terminal,group:(Math.floor(i/2)+i%2)%2}));
 }
 return Object.freeze(out);
}
