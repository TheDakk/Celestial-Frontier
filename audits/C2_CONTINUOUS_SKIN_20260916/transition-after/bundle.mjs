Object.freeze([
	"hopper",
	"biped-bird",
	"fish",
	"insect",
	"serpent",
	"arachnid",
	"radial",
	"plant-woody",
	"plant-herb",
	"myriapod",
	"cephalopod",
	"flyer-membrane",
	"primate"
]);
Object.freeze(["plant-woody", "plant-herb"]);
const dist$1 = (a, b) => Math.hypot(a[0] - b[0], a[1] - b[1]);
const need$1 = (v, what) => {
	if (v === void 0) throw new Error("template bound: " + what);
	return v;
};
/** A linear chain parent→names[0]→names[1]… */
const chain = (parent, names) => names.map((n, i) => [n, i === 0 ? parent : names[i - 1]]);
const seq = (prefix, n, parent) => chain(parent, Array.from({ length: n }, (_, i) => prefix + i));
const sides = ["Far", "Near"];
const F = (x) => Object.freeze(x);
const boneBounds = () => [{
	id: "bone-min",
	min: .001,
	max: .75,
	measure: (_, b) => Math.min(...Object.values(b))
}, {
	id: "bone-max",
	min: .001,
	max: .75,
	measure: (_, b) => Math.max(...Object.values(b))
}];
const axisBound = (a, b, min = .06, max = .85) => ({
	id: "body",
	min,
	max,
	measure: (lm) => dist$1(need$1(lm[a], a), need$1(lm[b], b))
});
const ratioBound = (id, joints, a, b, min, max) => ({
	id,
	min,
	max,
	measure: (lm, bones) => joints.reduce((s, j) => s + need$1(bones[j], j), 0) / dist$1(need$1(lm[a], a), need$1(lm[b], b))
});
const sec = (id, kind, driver, joints) => F({
	id,
	kind,
	driver,
	joints: F(joints)
});
const build = (s) => {
	const joints = ["root", ...s.graph.map(([c]) => c)];
	const limitFor = (j) => s.limits.find(([re]) => re.test(j))?.[1] ?? {
		min: -30,
		max: 30
	};
	return F({
		id: s.id,
		version: 1,
		clipSetId: s.clipSetId,
		graph: F(s.graph.map((p) => F(p))),
		joints: F(joints),
		legs: F(s.legs),
		limitsDeg: F(Object.fromEntries(joints.map((j) => [j, limitFor(j)]))),
		secondaryChains: F(s.secondaryChains),
		proportions: F(s.proportions),
		bodyAxis: F(s.bodyAxis)
	});
};
const QUAD_LEGS = [
	"hindFar",
	"foreFar",
	"hindNear",
	"foreNear"
];
const HOPPER$1 = build({
	id: "hopper",
	clipSetId: "hopper-land-v1",
	graph: [
		["pelvis", "root"],
		["spine", "pelvis"],
		["chest", "spine"],
		["neck", "chest"],
		["head", "neck"],
		["jaw", "head"],
		...QUAD_LEGS.flatMap((id) => chain(id.startsWith("hind") ? "pelvis" : "chest", [
			id + "Root",
			id + "Knee",
			id + "Ankle",
			id + "Paw"
		])),
		...seq("tail", 4, "pelvis"),
		...chain("head", ["earFarRoot", "earFarTip"]),
		...chain("head", ["earNearRoot", "earNearTip"])
	],
	legs: QUAD_LEGS,
	bodyAxis: ["pelvis", "chest"],
	limits: [
		[/^root$/, {
			min: -30,
			max: 30
		}],
		[/^pelvis$/, {
			min: -25,
			max: 25
		}],
		[/^spine$/, {
			min: -30,
			max: 30
		}],
		[/^chest$/, {
			min: -20,
			max: 20
		}],
		[/^(neck|head)$/, {
			min: -35,
			max: 35
		}],
		[/^jaw$/, {
			min: -30,
			max: 5
		}],
		[/^hind.*Root$/, {
			min: -70,
			max: 70
		}],
		[/^hind.*(Knee|Ankle)$/, {
			min: -110,
			max: 110
		}],
		[/^fore.*Root$/, {
			min: -60,
			max: 60
		}],
		[/^fore.*Knee$/, {
			min: -75,
			max: 75
		}],
		[/Ankle$/, {
			min: -60,
			max: 60
		}],
		[/Paw$/, {
			min: -45,
			max: 45
		}],
		[/^tail0$/, {
			min: -40,
			max: 40
		}],
		[/^tail[123]$/, {
			min: -50,
			max: 50
		}],
		[/Tip$/, {
			min: -40,
			max: 40
		}]
	],
	secondaryChains: [
		sec("tail", "tail", "pelvis", [
			"tail0",
			"tail1",
			"tail2",
			"tail3"
		]),
		sec("earFar", "ear", "head", ["earFarRoot", "earFarTip"]),
		sec("earNear", "ear", "head", ["earNearRoot", "earNearTip"])
	],
	proportions: [
		axisBound("pelvis", "chest", .08, .65),
		...boneBounds(),
		...QUAD_LEGS.map((leg) => ratioBound("leg/torso:" + leg, [
			leg + "Knee",
			leg + "Ankle",
			leg + "Paw"
		], "pelvis", "chest", .25, 3.2))
	]
});
const birdLegs = sides.map((s) => "leg" + s);
const BIRD$1 = build({
	id: "biped-bird",
	clipSetId: "biped-bird-v1",
	legs: birdLegs,
	bodyAxis: ["pelvis", "chest"],
	graph: [
		["pelvis", "root"],
		["spine", "pelvis"],
		["chest", "spine"],
		...chain("chest", [
			"neck0",
			"neck1",
			"head",
			"beak"
		]),
		...birdLegs.flatMap((l) => chain("pelvis", [
			l + "Knee",
			l + "Ankle",
			l + "Foot"
		])),
		...sides.flatMap((s) => chain("chest", ["wing" + s + "Root", "wing" + s + "Tip"])),
		["tailFan", "pelvis"]
	],
	limits: [
		[/^root$/, {
			min: -25,
			max: 25
		}],
		[/^(pelvis|chest)$/, {
			min: -20,
			max: 20
		}],
		[/^spine$/, {
			min: -25,
			max: 25
		}],
		[/^neck[01]$/, {
			min: -45,
			max: 45
		}],
		[/^head$/, {
			min: -40,
			max: 40
		}],
		[/^beak$/, {
			min: -30,
			max: 5
		}],
		[/Knee$/, {
			min: -70,
			max: 70
		}],
		[/Ankle$/, {
			min: -85,
			max: 85
		}],
		[/Foot$/, {
			min: -45,
			max: 45
		}],
		[/^wing.*Root$/, {
			min: -60,
			max: 95
		}],
		[/^wing.*Tip$/, {
			min: -70,
			max: 70
		}],
		[/^tailFan$/, {
			min: -40,
			max: 40
		}]
	],
	secondaryChains: [
		sec("wingFar", "wing", "chest", ["wingFarRoot", "wingFarTip"]),
		sec("wingNear", "wing", "chest", ["wingNearRoot", "wingNearTip"]),
		sec("tailFan", "tailfan", "pelvis", ["tailFan"])
	],
	proportions: [
		axisBound("pelvis", "chest", .06, .65),
		...boneBounds(),
		...birdLegs.map((l) => ratioBound("leg/torso:" + l, [
			l + "Knee",
			l + "Ankle",
			l + "Foot"
		], "pelvis", "chest", .3, 3.5)),
		ratioBound("wing/torso", ["wingFarRoot", "wingFarTip"], "pelvis", "chest", .4, 4.5)
	]
});
Array.from({ length: 6 }, (_, i) => "spine" + i);
const FISH$1 = build({
	id: "fish",
	clipSetId: "fish-aquatic-v1",
	legs: [],
	bodyAxis: ["spine0", "spine5"],
	graph: [
		["head", "root"],
		["jaw", "head"],
		...seq("spine", 6, "root"),
		["caudal", "spine5"],
		["dorsal", "spine1"],
		["pectoralFar", "root"],
		["pectoralNear", "root"]
	],
	limits: [
		[/^root$/, {
			min: -30,
			max: 30
		}],
		[/^head$/, {
			min: -30,
			max: 30
		}],
		[/^jaw$/, {
			min: -35,
			max: 5
		}],
		[/^spine[0-5]$/, {
			min: -35,
			max: 35
		}],
		[/^caudal$/, {
			min: -50,
			max: 50
		}],
		[/^dorsal$/, {
			min: -35,
			max: 35
		}],
		[/^pectoral/, {
			min: -60,
			max: 60
		}]
	],
	secondaryChains: [
		sec("caudal", "fin", "spine5", ["caudal"]),
		sec("dorsal", "fin", "spine1", ["dorsal"]),
		sec("pectoralFar", "fin", "root", ["pectoralFar"]),
		sec("pectoralNear", "fin", "root", ["pectoralNear"])
	],
	proportions: [
		axisBound("spine0", "spine5", .1, .85),
		...boneBounds(),
		ratioBound("caudal/body", ["caudal"], "spine0", "spine5", .05, .9),
		ratioBound("head/body", ["head"], "spine0", "spine5", .04, .8)
	]
});
const insectLegs = [
	"Front",
	"Mid",
	"Hind"
].flatMap((p) => sides.map((s) => "leg" + p + s));
const INSECT$1 = build({
	id: "insect",
	clipSetId: "insect-v1",
	legs: insectLegs,
	bodyAxis: ["abdomen", "head"],
	graph: [
		["thorax", "root"],
		["head", "thorax"],
		["mandible", "head"],
		["abdomen", "thorax"],
		...insectLegs.flatMap((l) => chain("thorax", [l + "Knee", l + "Foot"])),
		["antennaFar", "head"],
		["antennaNear", "head"],
		["wingFar", "thorax"],
		["wingNear", "thorax"]
	],
	limits: [
		[/^root$/, {
			min: -25,
			max: 25
		}],
		[/^thorax$/, {
			min: -15,
			max: 15
		}],
		[/^head$/, {
			min: -35,
			max: 35
		}],
		[/^mandible$/, {
			min: -40,
			max: 5
		}],
		[/^abdomen$/, {
			min: -35,
			max: 50
		}],
		[/Knee$/, {
			min: -65,
			max: 65
		}],
		[/Foot$/, {
			min: -75,
			max: 75
		}],
		[/^antenna/, {
			min: -50,
			max: 50
		}],
		[/^wing/, {
			min: -85,
			max: 85
		}]
	],
	secondaryChains: [
		sec("antennaFar", "antenna", "head", ["antennaFar"]),
		sec("antennaNear", "antenna", "head", ["antennaNear"]),
		sec("wingFar", "wing", "thorax", ["wingFar"]),
		sec("wingNear", "wing", "thorax", ["wingNear"])
	],
	proportions: [
		axisBound("abdomen", "head", .08, .85),
		...boneBounds(),
		...insectLegs.map((l) => ratioBound("leg/body:" + l, [l + "Knee", l + "Foot"], "abdomen", "head", .1, 2.5))
	]
});
const SERPENT$1 = build({
	id: "serpent",
	clipSetId: "serpent-v1",
	legs: [],
	bodyAxis: ["seg0", "seg9"],
	graph: [
		["head", "root"],
		["jaw", "head"],
		...seq("seg", 10, "root")
	],
	limits: [
		[/^root$/, {
			min: -25,
			max: 25
		}],
		[/^head$/, {
			min: -50,
			max: 50
		}],
		[/^jaw$/, {
			min: -45,
			max: 5
		}],
		[/^seg\d$/, {
			min: -45,
			max: 45
		}]
	],
	secondaryChains: [sec("tail", "tail", "seg6", [
		"seg7",
		"seg8",
		"seg9"
	])],
	proportions: [
		axisBound("seg0", "seg9", .1, .9),
		...boneBounds(),
		ratioBound("head/body", ["head"], "seg0", "seg9", .02, .5)
	]
});
const arachnidLegs = [
	1,
	2,
	3,
	4
].flatMap((n) => sides.map((s) => "leg" + n + s));
const ARACHNID$1 = build({
	id: "arachnid",
	clipSetId: "arachnid-v1",
	legs: arachnidLegs,
	bodyAxis: ["abdomen", "cephalothorax"],
	graph: [
		["cephalothorax", "root"],
		["abdomen", "cephalothorax"],
		["sting", "abdomen"],
		["cheliceraFar", "cephalothorax"],
		["cheliceraNear", "cephalothorax"],
		...arachnidLegs.flatMap((l) => chain("cephalothorax", [l + "Knee", l + "Foot"]))
	],
	limits: [
		[/^root$/, {
			min: -25,
			max: 25
		}],
		[/^cephalothorax$/, {
			min: -15,
			max: 15
		}],
		[/^abdomen$/, {
			min: -35,
			max: 65
		}],
		[/^sting$/, {
			min: -70,
			max: 70
		}],
		[/^chelicera/, {
			min: -45,
			max: 45
		}],
		[/Knee$/, {
			min: -65,
			max: 65
		}],
		[/Foot$/, {
			min: -75,
			max: 75
		}]
	],
	secondaryChains: [sec("abdomen", "tail", "cephalothorax", ["abdomen", "sting"])],
	proportions: [
		axisBound("abdomen", "cephalothorax", .05, .7),
		...boneBounds(),
		...arachnidLegs.map((l) => ratioBound("leg/body:" + l, [l + "Knee", l + "Foot"], "abdomen", "cephalothorax", .15, 4))
	]
});
const arms = [
	0,
	1,
	2,
	3,
	4,
	5
].map((n) => "arm" + n);
const RADIAL$1 = build({
	id: "radial",
	clipSetId: "radial-v1",
	legs: [],
	bodyAxis: ["centre", "bell"],
	graph: [
		["centre", "root"],
		["bell", "centre"],
		...arms.flatMap((a) => chain("centre", [
			a + "Seg0",
			a + "Seg1",
			a + "Seg2"
		]))
	],
	limits: [
		[/^root$/, {
			min: -35,
			max: 35
		}],
		[/^centre$/, {
			min: -15,
			max: 15
		}],
		[/^bell$/, {
			min: -25,
			max: 25
		}],
		[/Seg0$/, {
			min: -45,
			max: 45
		}],
		[/Seg[12]$/, {
			min: -55,
			max: 55
		}]
	],
	secondaryChains: [sec("bell", "bell", "centre", ["bell"]), ...arms.map((a) => sec(a, "arm", "centre", [
		a + "Seg0",
		a + "Seg1",
		a + "Seg2"
	]))],
	proportions: [
		axisBound("centre", "bell", .03, .6),
		...boneBounds(),
		...arms.map((a) => ratioBound("arm/bell:" + a, [
			a + "Seg0",
			a + "Seg1",
			a + "Seg2"
		], "centre", "bell", .3, 8))
	]
});
const myriaPairs = [
	"legA",
	"legB",
	"legC",
	"legD"
];
const myriaLegs = myriaPairs.flatMap((p) => sides.map((s) => p + s));
const MYRIAPOD$1 = build({
	id: "myriapod",
	clipSetId: "myriapod-v1",
	legs: myriaLegs,
	bodyAxis: ["seg7", "head"],
	graph: [
		["head", "root"],
		["mandible", "head"],
		...seq("seg", 8, "root"),
		...myriaPairs.flatMap((p, i) => sides.flatMap((s) => chain("seg" + i * 2, [p + s + "Knee", p + s + "Foot"]))),
		["antennaFar", "head"],
		["antennaNear", "head"]
	],
	limits: [
		[/^root$/, {
			min: -20,
			max: 20
		}],
		[/^head$/, {
			min: -35,
			max: 35
		}],
		[/^mandible$/, {
			min: -40,
			max: 5
		}],
		[/^seg[0-3]$/, {
			min: -35,
			max: 35
		}],
		[/^seg[4-7]$/, {
			min: -60,
			max: 60
		}],
		[/Knee$/, {
			min: -60,
			max: 60
		}],
		[/Foot$/, {
			min: -70,
			max: 70
		}],
		[/^antenna/, {
			min: -50,
			max: 50
		}]
	],
	secondaryChains: [
		sec("tail", "tail", "seg5", ["seg6", "seg7"]),
		sec("antennaFar", "antenna", "head", ["antennaFar"]),
		sec("antennaNear", "antenna", "head", ["antennaNear"])
	],
	proportions: [
		axisBound("seg7", "head", .1, .95),
		...boneBounds(),
		...myriaLegs.map((l) => ratioBound("leg/body:" + l, [l + "Knee", l + "Foot"], "seg7", "head", .05, 1.5))
	]
});
const cephArms = [
	0,
	1,
	2,
	3,
	4,
	5,
	6,
	7
].map((n) => "arm" + n);
const CEPHALOPOD$1 = build({
	id: "cephalopod",
	clipSetId: "cephalopod-v1",
	legs: [],
	bodyAxis: ["head", "mantle"],
	graph: [
		["mantle", "root"],
		["head", "root"],
		["eyeFar", "head"],
		["eyeNear", "head"],
		["siphon", "head"],
		["finFar", "mantle"],
		["finNear", "mantle"],
		...cephArms.flatMap((a) => chain("head", [
			a + "Seg0",
			a + "Seg1",
			a + "Seg2"
		]))
	],
	limits: [
		[/^root$/, {
			min: -30,
			max: 30
		}],
		[/^mantle$/, {
			min: -25,
			max: 25
		}],
		[/^head$/, {
			min: -30,
			max: 30
		}],
		[/^eye/, {
			min: -20,
			max: 20
		}],
		[/^siphon$/, {
			min: -45,
			max: 45
		}],
		[/^fin/, {
			min: -40,
			max: 40
		}],
		[/Seg0$/, {
			min: -55,
			max: 55
		}],
		[/Seg1$/, {
			min: -70,
			max: 70
		}],
		[/Seg2$/, {
			min: -80,
			max: 80
		}]
	],
	secondaryChains: [
		sec("finFar", "fin", "mantle", ["finFar"]),
		sec("finNear", "fin", "mantle", ["finNear"]),
		...cephArms.map((a) => sec(a, "tentacle", "head", [
			a + "Seg0",
			a + "Seg1",
			a + "Seg2"
		]))
	],
	proportions: [
		axisBound("head", "mantle", .05, .7),
		...boneBounds(),
		...cephArms.map((a) => ratioBound("arm/body:" + a, [
			a + "Seg0",
			a + "Seg1",
			a + "Seg2"
		], "head", "mantle", .3, 6))
	]
});
const batWings = sides.map((s) => "wing" + s);
const batLegs = sides.map((s) => "leg" + s);
const FLYER$1 = build({
	id: "flyer-membrane",
	clipSetId: "flyer-membrane-v1",
	legs: batLegs,
	bodyAxis: ["pelvis", "chest"],
	graph: [
		["pelvis", "root"],
		["spine", "pelvis"],
		["chest", "spine"],
		["neck", "chest"],
		["head", "neck"],
		["jaw", "head"],
		...batWings.flatMap((w) => chain("chest", [
			w + "Root",
			w + "Elbow",
			w + "Wrist",
			w + "Tip"
		])),
		...batLegs.flatMap((l) => chain("pelvis", [l + "Knee", l + "Foot"])),
		["earFarTip", "head"],
		["earNearTip", "head"],
		["tail0", "pelvis"]
	],
	limits: [
		[/^root$/, {
			min: -35,
			max: 35
		}],
		[/^(pelvis|chest)$/, {
			min: -20,
			max: 20
		}],
		[/^spine$/, {
			min: -25,
			max: 25
		}],
		[/^neck$/, {
			min: -35,
			max: 35
		}],
		[/^head$/, {
			min: -40,
			max: 40
		}],
		[/^jaw$/, {
			min: -40,
			max: 5
		}],
		[/^wing.*Root$/, {
			min: -80,
			max: 100
		}],
		[/^wing.*Elbow$/, {
			min: -90,
			max: 90
		}],
		[/^wing.*Wrist$/, {
			min: -80,
			max: 80
		}],
		[/^wing.*Tip$/, {
			min: -70,
			max: 70
		}],
		[/Knee$/, {
			min: -70,
			max: 70
		}],
		[/Foot$/, {
			min: -60,
			max: 60
		}],
		[/^ear/, {
			min: -40,
			max: 40
		}],
		[/^tail0$/, {
			min: -45,
			max: 45
		}]
	],
	secondaryChains: [
		sec("wingFar", "membrane", "chest", [
			"wingFarRoot",
			"wingFarElbow",
			"wingFarWrist",
			"wingFarTip"
		]),
		sec("wingNear", "membrane", "chest", [
			"wingNearRoot",
			"wingNearElbow",
			"wingNearWrist",
			"wingNearTip"
		]),
		sec("earFar", "ear", "head", ["earFarTip"]),
		sec("earNear", "ear", "head", ["earNearTip"]),
		sec("tail", "tail", "pelvis", ["tail0"])
	],
	proportions: [
		axisBound("pelvis", "chest", .05, .6),
		...boneBounds(),
		...batWings.map((w) => ratioBound("wing/torso:" + w, [
			w + "Root",
			w + "Elbow",
			w + "Wrist",
			w + "Tip"
		], "pelvis", "chest", .8, 12)),
		...batLegs.map((l) => ratioBound("leg/torso:" + l, [l + "Knee", l + "Foot"], "pelvis", "chest", .2, 4))
	]
});
const primArms = sides.map((s) => "arm" + s);
const primLegs = sides.map((s) => "leg" + s);
const PRIMATE$1 = build({
	id: "primate",
	clipSetId: "primate-v1",
	legs: primLegs,
	bodyAxis: ["pelvis", "chest"],
	graph: [
		["pelvis", "root"],
		["spine", "pelvis"],
		["chest", "spine"],
		["neck", "chest"],
		["head", "neck"],
		["jaw", "head"],
		...primArms.flatMap((a) => chain("chest", [
			a + "Shoulder",
			a + "Elbow",
			a + "Hand"
		])),
		...primLegs.flatMap((l) => chain("pelvis", [
			l + "Hip",
			l + "Knee",
			l + "Foot"
		])),
		...seq("tail", 3, "pelvis")
	],
	limits: [
		[/^root$/, {
			min: -30,
			max: 30
		}],
		[/^pelvis$/, {
			min: -25,
			max: 25
		}],
		[/^spine$/, {
			min: -30,
			max: 30
		}],
		[/^chest$/, {
			min: -25,
			max: 25
		}],
		[/^neck$/, {
			min: -35,
			max: 35
		}],
		[/^head$/, {
			min: -40,
			max: 40
		}],
		[/^jaw$/, {
			min: -35,
			max: 5
		}],
		[/Shoulder$/, {
			min: -100,
			max: 100
		}],
		[/Elbow$/, {
			min: -110,
			max: 110
		}],
		[/Hand$/, {
			min: -60,
			max: 60
		}],
		[/Hip$/, {
			min: -80,
			max: 80
		}],
		[/Knee$/, {
			min: -110,
			max: 110
		}],
		[/Foot$/, {
			min: -50,
			max: 50
		}],
		[/^tail0$/, {
			min: -40,
			max: 40
		}],
		[/^tail[12]$/, {
			min: -50,
			max: 50
		}]
	],
	secondaryChains: [sec("tail", "tail", "pelvis", [
		"tail0",
		"tail1",
		"tail2"
	])],
	proportions: [
		axisBound("pelvis", "chest", .06, .6),
		...boneBounds(),
		...primArms.map((a) => ratioBound("arm/torso:" + a, [
			a + "Shoulder",
			a + "Elbow",
			a + "Hand"
		], "pelvis", "chest", .5, 4)),
		...primLegs.map((l) => ratioBound("leg/torso:" + l, [
			l + "Hip",
			l + "Knee",
			l + "Foot"
		], "pelvis", "chest", .5, 4))
	]
});
const branches = [
	0,
	1,
	2
].map((n) => "branch" + n);
const WOODY$1 = build({
	id: "plant-woody",
	clipSetId: "plant-woody-v1",
	legs: [],
	bodyAxis: ["root", "trunk"],
	graph: [["trunk", "root"], ...branches.flatMap((b, i) => [...chain("trunk", [b + "Base", b + "Tip"]), ["leaf" + i, b + "Tip"]])],
	limits: [
		[/^root$/, {
			min: -5,
			max: 5
		}],
		[/^trunk$/, {
			min: -12,
			max: 12
		}],
		[/Base$/, {
			min: -25,
			max: 25
		}],
		[/Tip$/, {
			min: -35,
			max: 35
		}],
		[/^leaf/, {
			min: -45,
			max: 45
		}]
	],
	secondaryChains: branches.map((b, i) => sec(b, "frond", "trunk", [
		b + "Base",
		b + "Tip",
		"leaf" + i
	])),
	proportions: [
		axisBound("root", "trunk", .08, .8),
		...boneBounds(),
		...branches.map((b) => ratioBound("branch/trunk:" + b, [b + "Base", b + "Tip"], "root", "trunk", .1, 2.5))
	]
});
const stems = [
	0,
	1,
	2,
	3
].map((n) => "stem" + n);
const FAMILY_TEMPLATES = F({
	hopper: HOPPER$1,
	"biped-bird": BIRD$1,
	fish: FISH$1,
	insect: INSECT$1,
	serpent: SERPENT$1,
	arachnid: ARACHNID$1,
	radial: RADIAL$1,
	"plant-woody": WOODY$1,
	"plant-herb": build({
		id: "plant-herb",
		clipSetId: "plant-herb-v1",
		legs: [],
		bodyAxis: ["stem0Seg0", "stem0Seg2"],
		graph: stems.flatMap((s, i) => [...chain("root", [
			s + "Seg0",
			s + "Seg1",
			s + "Seg2"
		]), ["frond" + i, s + "Seg2"]]),
		limits: [
			[/^root$/, {
				min: -5,
				max: 5
			}],
			[/Seg0$/, {
				min: -25,
				max: 25
			}],
			[/Seg[12]$/, {
				min: -40,
				max: 40
			}],
			[/^frond/, {
				min: -50,
				max: 50
			}]
		],
		secondaryChains: stems.map((s, i) => sec(s, "frond", "root", [
			s + "Seg0",
			s + "Seg1",
			s + "Seg2",
			"frond" + i
		])),
		proportions: [
			axisBound("stem0Seg0", "stem0Seg2", .04, .8),
			...boneBounds(),
			...stems.map((s) => ratioBound("stem/stem0:" + s, [s + "Seg1", s + "Seg2"], "stem0Seg0", "stem0Seg2", .2, 4))
		]
	}),
	myriapod: MYRIAPOD$1,
	cephalopod: CEPHALOPOD$1,
	"flyer-membrane": FLYER$1,
	primate: PRIMATE$1
});
F({
	mammal: "quadruped",
	reptile: "quadruped",
	amphibian: "quadruped",
	turtle: "quadruped",
	quadruped: "quadruped",
	frog: "hopper",
	hopper: "hopper",
	leaper: "hopper",
	bird: "biped-bird",
	fish: "fish",
	marine: "fish",
	insect: "insect",
	arachnid: "arachnid",
	crust: "arachnid",
	snake: "serpent",
	serpent: "serpent",
	jelly: "radial",
	sessile: "radial",
	radial: "radial",
	myriapod: "myriapod",
	centipede: "myriapod",
	millipede: "myriapod",
	ceph: "cephalopod",
	cephalopod: "cephalopod",
	bat: "flyer-membrane",
	"flyer-membrane": "flyer-membrane",
	primate: "primate",
	tree: "plant-woody",
	shrub: "plant-woody",
	vine: "plant-woody",
	cane: "plant-woody",
	fern: "plant-herb",
	grass: "plant-herb",
	rosette: "plant-herb",
	seaweed: "plant-herb",
	fungal: "plant-herb"
});
//#endregion
//#region ../celestial-frontier-anthropic-mac/port/v2/apps/game/src/motion/templates.ts
const QUADRUPED_LEGS = Object.freeze([
	"hindFar",
	"foreFar",
	"hindNear",
	"foreNear"
]);
const legGraph = (id) => [
	[id + "Root", id.startsWith("hind") ? "pelvis" : "chest"],
	[id + "Knee", id + "Root"],
	[id + "Ankle", id + "Knee"],
	[id + "Paw", id + "Ankle"]
];
const QUADRUPED_GRAPH = Object.freeze([
	["pelvis", "root"],
	["spine", "pelvis"],
	["chest", "spine"],
	["neck", "chest"],
	["head", "neck"],
	["jaw", "head"],
	...QUADRUPED_LEGS.flatMap(legGraph),
	["tail0", "pelvis"],
	["tail1", "tail0"],
	["tail2", "tail1"],
	["tail3", "tail2"],
	["earFarRoot", "head"],
	["earFarTip", "earFarRoot"],
	["earNearRoot", "head"],
	["earNearTip", "earNearRoot"]
].map((pair) => Object.freeze(pair)));
/** Joint limits in degrees, by bone family. Tunable; poses beyond are clamped and flagged. */
const LIMIT_TABLE = [
	[/^root$/, {
		min: -15,
		max: 15
	}],
	[/^pelvis$/, {
		min: -20,
		max: 20
	}],
	[/^spine$/, {
		min: -25,
		max: 25
	}],
	[/^chest$/, {
		min: -20,
		max: 20
	}],
	[/^neck$/, {
		min: -35,
		max: 35
	}],
	[/^head$/, {
		min: -35,
		max: 35
	}],
	[/^jaw$/, {
		min: -30,
		max: 5
	}],
	[/Root$/, {
		min: -60,
		max: 60
	}],
	[/Knee$/, {
		min: -75,
		max: 75
	}],
	[/Ankle$/, {
		min: -60,
		max: 60
	}],
	[/Paw$/, {
		min: -40,
		max: 40
	}],
	[/^tail0$/, {
		min: -40,
		max: 40
	}],
	[/^tail[123]$/, {
		min: -50,
		max: 50
	}],
	[/Tip$/, {
		min: -40,
		max: 40
	}]
];
const limitFor = (joint) => LIMIT_TABLE.find(([re]) => re.test(joint))?.[1] ?? {
	min: -30,
	max: 30
};
const dist = (a, b) => Math.hypot(a[0] - b[0], a[1] - b[1]);
const need = (v, what) => {
	if (v === void 0) throw new Error("template bound: " + what);
	return v;
};
const QUADRUPED_TEMPLATE = Object.freeze({
	id: "quadruped",
	version: 1,
	clipSetId: "quadruped-land-v1",
	graph: QUADRUPED_GRAPH,
	joints: Object.freeze(["root", ...QUADRUPED_GRAPH.map(([child]) => child)]),
	legs: QUADRUPED_LEGS,
	limitsDeg: Object.freeze(Object.fromEntries(["root", ...QUADRUPED_GRAPH.map(([c]) => c)].map((j) => [j, limitFor(j)]))),
	secondaryChains: Object.freeze([
		{
			id: "tail",
			driver: "pelvis",
			joints: Object.freeze([
				"tail0",
				"tail1",
				"tail2",
				"tail3"
			])
		},
		{
			id: "earFar",
			driver: "head",
			joints: Object.freeze(["earFarRoot", "earFarTip"])
		},
		{
			id: "earNear",
			driver: "head",
			joints: Object.freeze(["earNearRoot", "earNearTip"])
		}
	]),
	proportions: Object.freeze([
		{
			id: "torso",
			min: .08,
			max: .65,
			measure: (lm) => dist(need(lm.pelvis, "pelvis"), need(lm.chest, "chest"))
		},
		{
			id: "head",
			min: .015,
			max: .75,
			measure: (lm) => dist(need(lm.neck, "neck"), need(lm.head, "head"))
		},
		{
			id: "head/torso",
			min: .02,
			max: 1.6,
			measure: (lm) => dist(need(lm.neck, "neck"), need(lm.head, "head")) / dist(need(lm.pelvis, "pelvis"), need(lm.chest, "chest"))
		},
		{
			id: "bone-min",
			min: .001,
			max: .75,
			measure: (_, b) => Math.min(...Object.values(b))
		},
		{
			id: "bone-max",
			min: .001,
			max: .75,
			measure: (_, b) => Math.max(...Object.values(b))
		},
		...QUADRUPED_LEGS.map((leg) => ({
			id: "leg/torso:" + leg,
			min: .25,
			max: 2.7,
			measure: (lm, b) => (need(b[leg + "Knee"], leg) + need(b[leg + "Ankle"], leg) + need(b[leg + "Paw"], leg)) / dist(need(lm.pelvis, "pelvis"), need(lm.chest, "chest"))
		}))
	])
});
const REGISTRY = Object.freeze({
	quadruped: QUADRUPED_TEMPLATE,
	...FAMILY_TEMPLATES
});
Object.freeze(Object.keys(REGISTRY));
Math.PI * 2;
Object.freeze({
	tiny: .7,
	small: .85,
	medium: 1,
	large: 1.2,
	huge: 1.4,
	titanic: 1.6
});
Object.freeze([
	"tiny",
	"small",
	"medium",
	"large",
	"huge",
	"titanic"
]);
const SMEAR_FRAME_MS = 1e3 / 60;
Object.freeze({
	desktop: 60,
	phone: 30
});
/** Ordered phases per action (kit §5). `feed` and `tame` are A1 defaults, not kit rows. */
const ACTION_PHASES = Object.freeze({
	idle: [["period", 3e3]],
	alert: [["lift", 220]],
	approach: [["stride", 420]],
	melee: [
		["anticipation", 140],
		["strike", 90],
		["smear", SMEAR_FRAME_MS],
		["recovery", 260]
	],
	cast: [
		["rise", 180],
		["hold", 120],
		["release", 90],
		["settle", 220]
	],
	hit: [
		["recoil", 110],
		["stagger", 160],
		["settle", 180]
	],
	dodge: [["out", 120], ["back", 160]],
	faint: [["fall", 520]],
	victory: [
		["rear", 210],
		["toss", 150],
		["settle", 240]
	],
	return: [["walk", 380]],
	tame: [
		["approach", 260],
		["lower", 200],
		["settle", 180]
	],
	feed: [
		["down", 160],
		["chew", 120],
		["chew2", 120],
		["up", 180]
	],
	sway: [["period", 3e3]],
	disturb: [["recoil", 120], ["settle", 260]],
	harvest: [
		["shake", 180],
		["detach", 90],
		["settle", 220]
	],
	grow: [
		["rise", 320],
		["overshoot", 120],
		["settle", 160]
	]
});
Object.freeze({
	baseMs: 70,
	capMs: 140
});
Object.freeze({
	whiteFrames: 2,
	fadeMs: 120
});
Object.freeze({
	amplitudePx: 6,
	ms: 180
});
Object.freeze({
	popMs: 90,
	popEase: "back-out",
	riseMs: 420,
	fadeMs: 160
});
Object.freeze({
	readyEaseFraction: .1,
	ease: "ease-out"
});
Object.freeze({
	minMs: 2600,
	maxMs: 3400
});
/** Normalized time at `fraction` through `phase` of an action family (mass-invariant). */
function tAt(actionFamily, phase, fraction = 1) {
	const phases = ACTION_PHASES[actionFamily];
	if (!phases) throw new Error("timing: no phases for " + actionFamily);
	const total = phases.reduce((s, [, ms]) => s + ms, 0);
	let acc = 0;
	for (const [name, ms] of phases) {
		if (name === phase) return (acc + ms * fraction) / total;
		acc += ms;
	}
	throw new Error(`timing: ${actionFamily} has no phase ${phase}`);
}
Object.freeze([
	"ease-out",
	"ease-in",
	"back-out",
	"sine-in-out"
]);
const P$1 = (t, ease, joints, dx = 0, dy = 0) => ({
	t,
	ease,
	joints,
	root: {
		dx,
		dy
	}
});
const REST$1 = {};
/** Upper legs (Knee bones) and lower legs (Ankle bones): fore/hind swing, +back / -forward. */
const legs$1 = (foreFar, hindFar, foreNear = foreFar, hindNear = hindFar, bend = 0) => ({
	foreFarKnee: foreFar,
	foreNearKnee: foreNear,
	hindFarKnee: hindFar,
	hindNearKnee: hindNear,
	foreFarAnkle: -bend,
	foreNearAnkle: -bend,
	hindFarAnkle: bend,
	hindNearAnkle: bend
});
const crouch = (depth) => ({
	...legs$1(-depth * .4, depth * .5, -depth * .4, depth * .5, depth),
	spine: depth * .3,
	tail0: -depth * .3
});
const ears$1 = (deg) => ({
	earFarTip: deg,
	earNearTip: deg
});
const strideA = (amp, bend) => ({ ...legs$1(-amp, amp, amp, -amp, bend) });
const strideB = (amp, bend) => ({ ...legs$1(amp, -amp, -amp, amp, bend) });
const gaitCycle = (id) => {
	if (id === "walk") return [
		P$1(.25, "sine-in-out", strideA(18, 8), 0, -.01),
		P$1(.5, "sine-in-out", { ...legs$1(0, 0, 0, 0, 14) }, 0, .004),
		P$1(.75, "sine-in-out", strideB(18, 8), 0, -.01),
		P$1(1, "sine-in-out", REST$1)
	];
	if (id === "trot") return [
		P$1(.25, "sine-in-out", {
			...strideA(26, 12),
			spine: -3,
			neck: -4
		}, 0, -.022),
		P$1(.5, "sine-in-out", {
			...legs$1(0, 0, 0, 0, 18),
			spine: 2
		}, 0, .006),
		P$1(.75, "sine-in-out", {
			...strideB(26, 12),
			spine: -3,
			neck: -4
		}, 0, -.022),
		P$1(1, "sine-in-out", REST$1)
	];
	if (id === "gallop") return [
		P$1(.2, "ease-in", {
			...legs$1(20, -20, 24, -24, 24),
			spine: 10,
			chest: 6,
			neck: 6,
			tail0: 12
		}, 0, .02),
		P$1(.45, "ease-out", {
			...legs$1(-36, 34, -30, 30, 4),
			spine: -12,
			chest: -6,
			neck: -10,
			head: -6,
			tail0: -14
		}, 0, -.08),
		P$1(.7, "ease-in", {
			...legs$1(20, -20, 24, -24, 24),
			spine: 10,
			chest: 6,
			neck: 6,
			tail0: 12
		}, 0, .02),
		P$1(.95, "ease-out", {
			...legs$1(-36, 34, -30, 30, 4),
			spine: -12,
			chest: -6,
			neck: -10,
			head: -6,
			tail0: -14
		}, 0, -.08),
		P$1(1, "ease-out", REST$1)
	];
	return [
		P$1(.3, "ease-in", {
			...crouch(36),
			head: 8
		}, 0, .04),
		P$1(.65, "ease-out", {
			...legs$1(-30, 34, -30, 34, 0),
			spine: -6,
			neck: -8,
			tail0: -10
		}, 0, -.14),
		P$1(1, "back-out", { ...crouch(16) }, 0, .016)
	];
};
/** Melee: anticipation crouch → launch → strike (one-frame smear) → recover. */
const meleeFor = (strike, launch = {}, anticipation = {}) => {
	const m = "melee";
	return [
		P$1(tAt(m, "anticipation"), "ease-in", {
			...crouch(30),
			spine: 12,
			neck: 8,
			head: 10,
			...anticipation
		}, -.04, .03),
		P$1(tAt(m, "strike"), "ease-out", {
			...legs$1(-30, 30, -30, 30, -10),
			spine: -6,
			neck: -10,
			head: -6,
			jaw: -10,
			tail0: -12,
			...launch
		}, .36, -.05),
		P$1(tAt(m, "smear"), "ease-out", {
			...legs$1(-30, 30, -30, 30, -10),
			spine: -2,
			head: 8,
			...strike
		}, .4, -.01),
		P$1(tAt(m, "recovery", .55), "back-out", {
			...crouch(10),
			head: 2
		}, .1, .01),
		P$1(1, "ease-out", REST$1)
	];
};
const QUADRUPED_ACTIONS = Object.freeze({
	idle: {
		id: "idle",
		family: "idle",
		loop: true,
		poses: [
			P$1(.25, "sine-in-out", {
				tail0: 4,
				tail1: 3,
				pelvis: 1
			}, .008, -.004),
			P$1(.5, "sine-in-out", {
				spine: -2,
				chest: -2,
				neck: -3,
				head: 1,
				...ears$1(-3)
			}, 0, -.011),
			P$1(.75, "sine-in-out", {
				tail0: -4,
				tail1: -3,
				pelvis: -1
			}, -.008, -.004),
			P$1(1, "sine-in-out", REST$1)
		]
	},
	alert: {
		id: "alert",
		family: "alert",
		loop: false,
		poses: [P$1(1, "back-out", {
			neck: -12,
			head: -8,
			spine: -3,
			tail0: -6,
			...ears$1(-20)
		}, 0, -.006)]
	},
	"approach:walk": {
		id: "approach:walk",
		family: "approach",
		loop: false,
		poses: gaitCycle("walk")
	},
	"approach:trot": {
		id: "approach:trot",
		family: "approach",
		loop: false,
		poses: gaitCycle("trot")
	},
	"approach:gallop": {
		id: "approach:gallop",
		family: "approach",
		loop: false,
		poses: gaitCycle("gallop")
	},
	"approach:hop": {
		id: "approach:hop",
		family: "approach",
		loop: false,
		poses: gaitCycle("hop")
	},
	"melee:bite": {
		id: "melee:bite",
		family: "melee",
		loop: false,
		poses: meleeFor({
			jaw: -25,
			head: 12,
			neck: 6,
			foreNearKnee: -40
		})
	},
	"melee:claw": {
		id: "melee:claw",
		family: "melee",
		loop: false,
		poses: meleeFor({
			jaw: -8,
			foreNearKnee: 40,
			foreNearAnkle: 30,
			head: 5
		}, {
			foreNearKnee: -55,
			foreNearAnkle: 30
		})
	},
	"melee:gore": {
		id: "melee:gore",
		family: "melee",
		loop: false,
		poses: meleeFor({
			neck: -25,
			head: -30,
			jaw: 0
		}, {
			neck: 20,
			head: 25,
			jaw: 0
		}, {
			neck: 18,
			head: 22
		})
	},
	"melee:tail": {
		id: "melee:tail",
		family: "melee",
		loop: false,
		poses: meleeFor({
			tail0: 35,
			tail1: 30,
			tail2: 20,
			tail3: 12,
			pelvis: 6,
			jaw: 0
		}, {
			tail0: -30,
			tail1: -22,
			tail2: -12,
			pelvis: -6,
			jaw: 0
		}, {
			pelvis: -8,
			tail0: -20,
			tail1: -12
		})
	},
	"melee:headbutt": {
		id: "melee:headbutt",
		family: "melee",
		loop: false,
		poses: meleeFor({
			neck: 20,
			head: 15,
			jaw: 0
		}, {
			neck: -15,
			head: -10,
			jaw: 0
		}, {
			neck: -15,
			head: -10
		})
	},
	cast: {
		id: "cast",
		family: "cast",
		loop: false,
		poses: [
			P$1(tAt("cast", "rise"), "ease-in", {
				pelvis: -5,
				spine: -18,
				chest: -15,
				neck: -12,
				...legs$1(-45, 10, -45, 10, 16),
				tail0: 8
			}, -.02, -.06),
			P$1(tAt("cast", "hold"), "sine-in-out", {
				pelvis: -5,
				spine: -18,
				chest: -15,
				neck: -14,
				head: -5,
				...legs$1(-42, 12, -48, 12, 16),
				tail0: 6,
				...ears$1(-8)
			}, -.02, -.064),
			P$1(tAt("cast", "release"), "ease-out", {
				spine: -10,
				chest: -6,
				neck: 10,
				head: 25,
				jaw: -15,
				...legs$1(-30, 20, -30, 20, 8)
			}, .06, -.03),
			P$1(1, "back-out", REST$1)
		]
	},
	hit: {
		id: "hit",
		family: "hit",
		loop: false,
		poses: [
			P$1(tAt("hit", "recoil"), "ease-out", {
				head: -20,
				neck: -12,
				spine: 6,
				chest: -6,
				pelvis: -4,
				jaw: -8,
				...ears$1(12),
				tail0: 10
			}, -.08, .02),
			P$1(tAt("hit", "stagger"), "ease-out", {
				head: -8,
				neck: -6,
				spine: 3,
				hindFarKnee: -12,
				hindFarAnkle: 18,
				foreNearKnee: 10,
				tail0: 6
			}, -.14, .012),
			P$1(1, "back-out", REST$1)
		]
	},
	dodge: {
		id: "dodge",
		family: "dodge",
		loop: false,
		poses: [P$1(tAt("dodge", "out"), "ease-out", {
			spine: -4,
			neck: -6,
			...legs$1(-12, 15, -12, 15, 6)
		}, -.25, -.04), P$1(1, "back-out", REST$1)]
	},
	faint: {
		id: "faint",
		family: "faint",
		loop: false,
		poses: [P$1(.45, "ease-in", {
			...crouch(40),
			head: 10,
			neck: 10
		}, 0, .1), P$1(1, "ease-out", {
			...legs$1(-20, 30, -20, 30, 60),
			root: 10,
			spine: 8,
			neck: 25,
			head: 30,
			tail0: 20,
			tail1: 12,
			...ears$1(16)
		}, -.02, .22)]
	},
	victory: {
		id: "victory",
		family: "victory",
		loop: false,
		poses: [
			P$1(tAt("victory", "rear"), "ease-out", {
				pelvis: -6,
				spine: -20,
				chest: -12,
				neck: -8,
				head: -15,
				jaw: -10,
				...legs$1(-45, 12, -45, 12, 14),
				tail0: -12
			}, 0, -.08),
			P$1(tAt("victory", "toss"), "back-out", {
				pelvis: -6,
				spine: -20,
				chest: -12,
				neck: -12,
				head: -25,
				...legs$1(-40, 12, -50, 12, 14),
				tail0: -16,
				...ears$1(-15)
			}, 0, -.084),
			P$1(1, "back-out", REST$1)
		]
	},
	tame: {
		id: "tame",
		family: "tame",
		loop: false,
		poses: [
			P$1(tAt("tame", "approach"), "ease-out", {
				head: -6,
				...strideA(12, 6)
			}, .12, -.008),
			P$1(tAt("tame", "lower"), "ease-out", {
				neck: 20,
				head: 18,
				spine: 3,
				...ears$1(-10),
				tail0: 4
			}, .12, .02),
			P$1(1, "back-out", { head: 6 }, .12, .004)
		]
	},
	feed: {
		id: "feed",
		family: "feed",
		loop: false,
		poses: [
			P$1(tAt("feed", "down"), "ease-out", {
				neck: 25,
				head: 20,
				foreFarKnee: 5,
				foreNearKnee: 5
			}, .02, .012),
			P$1(tAt("feed", "chew", .5), "sine-in-out", {
				neck: 25,
				head: 20,
				jaw: -14,
				foreFarKnee: 5,
				foreNearKnee: 5
			}, .02, .012),
			P$1(tAt("feed", "chew"), "sine-in-out", {
				neck: 25,
				head: 20,
				jaw: -2,
				foreFarKnee: 5,
				foreNearKnee: 5
			}, .02, .012),
			P$1(tAt("feed", "chew2", .5), "sine-in-out", {
				neck: 25,
				head: 20,
				jaw: -14,
				foreFarKnee: 5,
				foreNearKnee: 5
			}, .02, .012),
			P$1(tAt("feed", "chew2"), "sine-in-out", {
				neck: 25,
				head: 20,
				jaw: -2,
				foreFarKnee: 5,
				foreNearKnee: 5
			}, .02, .012),
			P$1(1, "back-out", REST$1)
		]
	}
});
Object.freeze(Object.keys(QUADRUPED_ACTIONS));
Math.PI / 180;
//#endregion
//#region ../celestial-frontier-anthropic-mac/port/v2/apps/game/src/motion/family-actions.ts
const cephArmsA = [
	0,
	1,
	2,
	3,
	4,
	5,
	6,
	7
].map((n) => "arm" + n);
const P = (t, ease, joints, dx = 0, dy = 0) => ({
	t,
	ease,
	joints,
	root: {
		dx,
		dy
	}
});
const REST = {};
const neg = (j, k = -1) => Object.fromEntries(Object.entries(j).map(([n, v]) => [n, v * k]));
const mul = (j, k) => neg(j, k);
const pair = (base, v, suffix = "") => ({
	[base + "Far" + suffix]: v,
	[base + "Near" + suffix]: v
});
const A = (id, family, poses, loop = false) => ({
	id,
	family,
	loop,
	poses
});
const loop4 = (a, mid, b, dxA = 0, dyA = 0, dyMid = 0) => [
	P(.25, "sine-in-out", a, dxA, dyA),
	P(.5, "sine-in-out", mid, 0, dyMid),
	P(.75, "sine-in-out", b, -dxA, dyA),
	P(1, "sine-in-out", REST)
];
const melee = (anticipation, launch, strike, recover, dx = [
	-.04,
	.36,
	.4,
	.1
], dy = [
	.03,
	-.05,
	-.01,
	.01
]) => [
	P(tAt("melee", "anticipation"), "ease-in", anticipation, dx[0], dy[0]),
	P(tAt("melee", "strike"), "ease-out", launch, dx[1], dy[1]),
	P(tAt("melee", "smear"), "ease-out", strike, dx[2], dy[2]),
	P(tAt("melee", "recovery", .55), "back-out", recover, dx[3], dy[3]),
	P(1, "ease-out", REST)
];
const cast = (rise, hold, release, dy = -.06) => [
	P(tAt("cast", "rise"), "ease-in", rise, -.02, dy),
	P(tAt("cast", "hold"), "sine-in-out", hold, -.02, dy - .004),
	P(tAt("cast", "release"), "ease-out", release, .06, dy * .5),
	P(1, "back-out", REST)
];
const hit = (recoil, stagger, dy = .02) => [
	P(tAt("hit", "recoil"), "ease-out", recoil, -.08, dy),
	P(tAt("hit", "stagger"), "ease-out", stagger, -.14, dy * .6),
	P(1, "back-out", REST)
];
const dodge = (out, dx = -.25, dy = -.04) => [P(tAt("dodge", "out"), "ease-out", out, dx, dy), P(1, "back-out", REST)];
const faint = (mid, end, dyMid = .1, dyEnd = .22) => [P(.45, "ease-in", mid, 0, dyMid), P(1, "ease-out", end, -.02, dyEnd)];
const victory = (rear, toss, dy = -.08) => [
	P(tAt("victory", "rear"), "ease-out", rear, 0, dy),
	P(tAt("victory", "toss"), "back-out", toss, 0, dy - .004),
	P(1, "back-out", REST)
];
const tame = (approach, lower, end) => [
	P(tAt("tame", "approach"), "ease-out", approach, .12, -.008),
	P(tAt("tame", "lower"), "ease-out", lower, .12, .02),
	P(1, "back-out", end, .12, .004)
];
const feed = (down, open, closed) => [
	P(tAt("feed", "down"), "ease-out", down, .02, .012),
	P(tAt("feed", "chew", .5), "sine-in-out", {
		...down,
		...open
	}, .02, .012),
	P(tAt("feed", "chew"), "sine-in-out", {
		...down,
		...closed
	}, .02, .012),
	P(tAt("feed", "chew2", .5), "sine-in-out", {
		...down,
		...open
	}, .02, .012),
	P(tAt("feed", "chew2"), "sine-in-out", {
		...down,
		...closed
	}, .02, .012),
	P(1, "back-out", REST)
];
const fauna = (s) => Object.freeze(Object.fromEntries([
	A("idle", "idle", loop4(s.idle[0], s.idle[1], s.idle[2], s.idle[3], s.idle[4], s.idle[5]), true),
	A("alert", "alert", [P(1, "back-out", s.alert[0], 0, s.alert[1])]),
	...Object.entries(s.approach).map(([g, poses]) => A("approach:" + g, "approach", poses)),
	...Object.entries(s.melee).map(([w, poses]) => A("melee:" + w, "melee", poses)),
	A("cast", "cast", s.cast),
	A("hit", "hit", s.hit),
	A("dodge", "dodge", s.dodge),
	A("faint", "faint", s.faint),
	A("victory", "victory", s.victory),
	A("tame", "tame", s.tame),
	A("feed", "feed", s.feed)
].map((a) => [a.id, a])));
const hind = (knee, ankle, paw = 0) => ({
	...pair("hind", knee, "Knee"),
	...pair("hind", ankle, "Ankle"),
	...pair("hind", paw, "Paw")
});
const fore = (knee, ankle = 0) => ({
	...pair("fore", knee, "Knee"),
	...pair("fore", ankle, "Ankle")
});
const ears = (deg) => pair("ear", deg, "Tip");
const HOPPER = fauna({
	idle: [
		{
			spine: -1,
			chest: -2,
			tail0: 3
		},
		{
			neck: -2,
			head: 1,
			...ears(-2)
		},
		{
			tail0: -3,
			spine: 1
		},
		.004,
		-.003,
		-.009
	],
	alert: [{
		neck: -14,
		head: -10,
		spine: -4,
		...ears(-22),
		...hind(-10, 8)
	}, -.006],
	approach: { hop: [
		P(.3, "ease-in", {
			...hind(50, -60),
			...fore(-20),
			spine: 10,
			head: 6,
			tail0: -8
		}, 0, .05),
		P(.55, "ease-out", {
			...hind(-70, 60, 20),
			...fore(-35, 10),
			spine: -10,
			neck: -8,
			tail0: -14,
			root: -8
		}, .3, -.18),
		P(.85, "ease-in", {
			...hind(30, -30),
			...fore(30, -20),
			spine: 8,
			root: 6
		}, .5, -.02),
		P(1, "back-out", {
			...hind(20, -24),
			...fore(-8),
			spine: 4
		}, 0, .012)
	] },
	melee: {
		kick: melee({
			...hind(60, -70),
			...fore(-15),
			spine: 10,
			head: 6
		}, {
			...hind(-90, 80),
			spine: -8,
			neck: -6,
			tail0: -10
		}, {
			hindNearKnee: -105,
			hindNearAnkle: 95,
			hindNearPaw: 30,
			hindFarKnee: -80,
			hindFarAnkle: 70,
			root: 8,
			spine: -4
		}, {
			...hind(25, -30),
			spine: 4
		}, [
			-.06,
			.3,
			.34,
			.1
		], [
			.04,
			-.08,
			-.03,
			.01
		]),
		bite: melee({
			...hind(45, -55),
			spine: 12,
			neck: 8,
			head: 10
		}, {
			...hind(-60, 55),
			spine: -6,
			neck: -10,
			head: -8,
			jaw: -12,
			tail0: -10
		}, {
			...hind(-50, 45),
			jaw: -28,
			head: 14,
			neck: 8,
			...fore(-30)
		}, {
			...hind(20, -25),
			head: 2
		})
	},
	cast: cast({
		...hind(35, -45),
		...fore(-45, 16),
		pelvis: -5,
		spine: -18,
		chest: -15,
		neck: -12,
		tail0: 8
	}, {
		...hind(35, -45),
		...fore(-48, 16),
		pelvis: -5,
		spine: -18,
		chest: -15,
		neck: -14,
		head: -5,
		...ears(-8)
	}, {
		...hind(20, -25),
		...fore(-30, 8),
		spine: -10,
		neck: 10,
		head: 25,
		jaw: -15
	}),
	hit: hit({
		head: -20,
		neck: -12,
		spine: 6,
		chest: -6,
		pelvis: -4,
		jaw: -8,
		...ears(12),
		tail0: 10
	}, {
		head: -8,
		neck: -6,
		spine: 3,
		...hind(-15, 18),
		...fore(10),
		tail0: 6
	}),
	dodge: dodge({
		...hind(-40, 40),
		...fore(15),
		spine: -4,
		neck: -6
	}, -.3, -.08),
	faint: faint({
		...hind(45, -55),
		...fore(20, 20),
		spine: 10,
		head: 10,
		neck: 10
	}, {
		...hind(30, -20),
		...fore(-25, 50),
		root: 12,
		spine: 8,
		neck: 22,
		head: 28,
		tail0: 20,
		tail1: 12,
		...ears(16)
	}),
	victory: victory({
		pelvis: -6,
		spine: -22,
		chest: -12,
		neck: -8,
		head: -15,
		jaw: -10,
		...fore(-50, 14),
		...hind(20, -10),
		tail0: -12
	}, {
		pelvis: -6,
		spine: -22,
		chest: -12,
		neck: -12,
		head: -28,
		...fore(-50, 14),
		...hind(20, -10),
		tail0: -16,
		...ears(-15)
	}),
	tame: tame({
		head: -6,
		...hind(15, -18),
		...fore(-10)
	}, {
		neck: 20,
		head: 18,
		spine: 3,
		...ears(-10),
		tail0: 4
	}, { head: 6 }),
	feed: feed({
		neck: 25,
		head: 20,
		...fore(5)
	}, { jaw: -14 }, { jaw: -2 })
});
const legs2 = (far, near, bend = 0) => ({
	legFarKnee: far,
	legNearKnee: near,
	legFarAnkle: -far * .8 + bend,
	legNearAnkle: -near * .8 + bend,
	legFarFoot: far * .4,
	legNearFoot: near * .4
});
/** Wing keys: + LIFTS the wing (the bones point backward from the chest, so clockwise-positive raises the tip). */
const wings = (root, tip) => ({
	...pair("wing", root, "Root"),
	...pair("wing", tip, "Tip")
});
const neck2 = (a, b, head = 0) => ({
	neck0: a,
	neck1: b,
	head
});
const BIRD = fauna({
	idle: [
		{
			...neck2(-2, 2),
			tailFan: 3
		},
		{
			spine: -2,
			chest: -2,
			head: 2,
			...wings(2, 0)
		},
		{
			tailFan: -3,
			head: -2
		},
		.004,
		-.003,
		-.01
	],
	alert: [{
		...neck2(-15, -12, -8),
		tailFan: -10,
		...wings(6, 0),
		spine: -3
	}, -.01],
	approach: {
		walk: loop4({
			...legs2(-22, 22, 6),
			...neck2(6, -4)
		}, {
			...legs2(0, 0, 14),
			...neck2(-4, 3)
		}, {
			...legs2(22, -22, 6),
			...neck2(6, -4)
		}, 0, -.01, .004),
		flight: [
			P(.25, "sine-in-out", {
				...wings(65, 35),
				...legs2(40, 40, -40),
				spine: -6,
				...neck2(4, 4)
			}, 0, -.12),
			P(.5, "sine-in-out", {
				...wings(10, -5),
				...legs2(40, 40, -40),
				spine: -4
			}, 0, -.16),
			P(.75, "sine-in-out", {
				...wings(-45, -40),
				...legs2(40, 40, -40),
				spine: 2,
				...neck2(-3, -3)
			}, 0, -.12),
			P(1, "sine-in-out", {
				...wings(20, 10),
				...legs2(40, 40, -40),
				spine: -4
			}, 0, -.1)
		]
	},
	melee: {
		peck: melee({
			...neck2(-22, -18, -10),
			spine: -4,
			...wings(12, 0)
		}, {
			...neck2(25, 20, 15),
			beak: -10,
			spine: 6,
			...wings(30, 10)
		}, {
			...neck2(35, 30, 25),
			beak: -25,
			spine: 8
		}, { ...neck2(-5, 0, 2) }, [
			-.03,
			.25,
			.3,
			.08
		]),
		claw: melee({
			legNearKnee: -30,
			spine: -6,
			...wings(30, 10),
			...neck2(-8, -6)
		}, {
			legNearKnee: -60,
			legNearAnkle: 70,
			legNearFoot: -30,
			...wings(50, 20),
			spine: -8
		}, {
			legNearKnee: -70,
			legNearAnkle: 82,
			legNearFoot: -42,
			...wings(55, 25),
			root: 6,
			spine: -6
		}, {
			legNearKnee: -15,
			legNearAnkle: 10
		}, [
			-.04,
			.28,
			.32,
			.1
		], [
			.02,
			-.06,
			-.03,
			.01
		])
	},
	cast: cast({
		...wings(80, 50),
		spine: -12,
		...neck2(-10, -8),
		tailFan: -12
	}, {
		...wings(85, 55),
		spine: -12,
		...neck2(-12, -10, -5),
		tailFan: -14
	}, {
		...wings(-20, -15),
		...neck2(15, 12, 20),
		beak: -15,
		spine: -6
	}, -.05),
	hit: hit({
		...neck2(-15, -10, -18),
		spine: 8,
		chest: -5,
		...wings(25, 10),
		tailFan: 15
	}, {
		...neck2(-6, -4, -6),
		legFarKnee: -15,
		legFarAnkle: 20,
		spine: 3,
		tailFan: 6
	}),
	dodge: dodge({
		...legs2(20, 20, -30),
		...wings(40, 15),
		spine: -4
	}, -.25, -.06),
	faint: faint({
		...legs2(40, 40, -50),
		spine: 8,
		...neck2(6, 6, 6)
	}, {
		...legs2(30, 30, -30),
		root: 14,
		spine: 10,
		...neck2(25, 25, 20),
		...wings(-30, -35),
		tailFan: 20
	}, .08, .2),
	victory: victory({
		...wings(85, 55),
		spine: -15,
		...neck2(-10, -8, -12),
		tailFan: -15
	}, {
		...wings(90, 60),
		spine: -15,
		...neck2(-12, -15, -30),
		tailFan: -25
	}, -.04),
	tame: tame({
		...legs2(-12, 12, 6),
		head: -4
	}, {
		...neck2(20, 18, 15),
		...wings(-5, 0),
		tailFan: 5,
		spine: 2
	}, { head: 5 }),
	feed: feed({
		...neck2(30, 30, 20),
		spine: 4
	}, { beak: -12 }, { beak: -2 })
});
const wave = (k) => mul({
	spine0: -6,
	spine1: -10,
	spine2: -4,
	spine3: 6,
	spine4: 12,
	spine5: 16,
	caudal: 20
}, k);
const pect = (v) => ({
	pectoralFar: -v,
	pectoralNear: v
});
const FISH = fauna({
	idle: [
		wave(.4),
		{
			...pect(6),
			dorsal: -3,
			head: 1
		},
		wave(-.4),
		.004,
		-.004,
		-.008
	],
	alert: [{
		head: -8,
		dorsal: -12,
		...pect(20),
		spine4: 6,
		spine5: 10,
		caudal: 14
	}, -.01],
	approach: { swim: loop4(wave(1), {
		...pect(12),
		dorsal: 4
	}, wave(-1), 0, -.01, -.014) },
	melee: { bite: melee({
		...wave(-.8),
		head: -6,
		...pect(-10)
	}, {
		...wave(.6),
		head: -4,
		jaw: -15,
		...pect(15)
	}, {
		head: 8,
		jaw: -30,
		spine0: -6,
		spine1: -4,
		...pect(20)
	}, {
		...wave(.2),
		head: 2
	}, [
		-.05,
		.3,
		.36,
		.1
	], [
		.01,
		-.02,
		-.01,
		0
	]) },
	cast: cast({
		head: -18,
		spine0: -8,
		spine1: -6,
		...pect(35),
		dorsal: -10
	}, {
		head: -20,
		spine0: -8,
		spine1: -6,
		...pect(38),
		dorsal: -12
	}, {
		head: 22,
		jaw: -20,
		spine0: 6,
		...pect(10)
	}, -.05),
	hit: hit({
		head: -14,
		spine0: 8,
		spine1: 10,
		spine2: 6,
		caudal: -10,
		...pect(-15)
	}, {
		...wave(-.5),
		root: -6,
		head: -4
	}, .01),
	dodge: dodge({
		...wave(1.2),
		root: -8,
		...pect(25)
	}, -.2, -.06),
	faint: faint({
		root: 15,
		...pect(-10)
	}, {
		root: 28,
		head: 10,
		...wave(.5),
		...pect(-20)
	}, .05, .2),
	victory: victory({
		root: -25,
		head: -10,
		...wave(-.7),
		...pect(40)
	}, {
		root: -20,
		head: -20,
		...wave(-.5),
		caudal: 35,
		...pect(45)
	}),
	tame: tame(wave(.6), {
		head: 15,
		spine0: 4,
		...pect(10)
	}, { head: 5 }),
	feed: feed({
		head: 18,
		spine0: 6,
		...pect(8)
	}, { jaw: -18 }, { jaw: -3 })
});
const tripodA = [
	"legFrontFar",
	"legMidNear",
	"legHindFar"
];
const tripodB = [
	"legFrontNear",
	"legMidFar",
	"legHindNear"
];
const legSet = (names, knee, foot) => Object.fromEntries(names.flatMap((n) => [[n + "Knee", knee], [n + "Foot", foot]]));
const tripod = (k, f) => ({
	...legSet(tripodA, -k, f),
	...legSet(tripodB, k, -f)
});
const allLegs6 = (knee, foot) => legSet([...tripodA, ...tripodB], knee, foot);
const frontLegs = (knee, foot = 0) => legSet(["legFrontFar", "legFrontNear"], knee, foot);
const ant = (v) => ({
	antennaFar: v,
	antennaNear: v
});
const wing1 = (v) => ({
	wingFar: v,
	wingNear: -v
});
const INSECT = fauna({
	idle: [
		{
			abdomen: 3,
			...ant(-4)
		},
		{
			thorax: -1,
			head: -2,
			abdomen: -2
		},
		{
			abdomen: -3,
			...ant(4)
		},
		.003,
		-.002,
		-.006
	],
	alert: [{
		head: -12,
		...ant(-30),
		thorax: -4,
		...frontLegs(-20)
	}, -.01],
	approach: {
		crawl: loop4(tripod(25, 15), {
			...allLegs6(-4, 6),
			thorax: -1
		}, tripod(-25, -15), 0, -.006, .003),
		flight: [
			P(.25, "sine-in-out", {
				...wing1(-70),
				...allLegs6(30, -40),
				abdomen: 8
			}, 0, -.11),
			P(.5, "sine-in-out", {
				...wing1(0),
				...allLegs6(30, -40),
				abdomen: 4
			}, 0, -.13),
			P(.75, "sine-in-out", {
				...wing1(70),
				...allLegs6(30, -40),
				abdomen: 8
			}, 0, -.11),
			P(1, "sine-in-out", {
				...wing1(-10),
				...allLegs6(30, -40),
				abdomen: 4
			}, 0, -.1)
		]
	},
	melee: { mandible: melee({
		head: -15,
		thorax: 4,
		...frontLegs(-25),
		abdomen: 6
	}, {
		head: 10,
		mandible: -20,
		...frontLegs(-10),
		thorax: -3
	}, {
		head: 18,
		mandible: -38,
		...frontLegs(30, -10),
		thorax: -2
	}, {
		head: 2,
		...frontLegs(5)
	}, [
		-.04,
		.28,
		.34,
		.1
	], [
		.02,
		-.03,
		-.01,
		.01
	]) },
	cast: cast({
		thorax: -10,
		head: -15,
		abdomen: 20,
		...wing1(-60),
		...frontLegs(-50),
		...legSet(["legMidFar", "legMidNear"], -25, 10)
	}, {
		thorax: -10,
		head: -18,
		abdomen: 22,
		...wing1(-65),
		...frontLegs(-55),
		...ant(-20)
	}, {
		head: 20,
		mandible: -15,
		abdomen: -10,
		...wing1(30),
		...frontLegs(10)
	}, -.04),
	hit: hit({
		head: -18,
		thorax: 6,
		abdomen: -12,
		...ant(25),
		...frontLegs(-10)
	}, {
		...legSet(["legHindFar", "legHindNear"], -20, 25),
		head: -6,
		abdomen: -4
	}, .012),
	dodge: dodge({
		...allLegs6(30, -35),
		head: -6,
		abdomen: -8
	}, -.22, -.03),
	faint: faint({
		...allLegs6(40, -50),
		thorax: 3
	}, {
		root: 12,
		thorax: 5,
		head: 15,
		abdomen: 20,
		...allLegs6(55, -65),
		...ant(30)
	}, .06, .16),
	victory: victory({
		thorax: -12,
		head: -20,
		abdomen: 25,
		...frontLegs(-55),
		...legSet(["legMidFar", "legMidNear"], -30, 10),
		...wing1(-75)
	}, {
		thorax: -12,
		head: -30,
		abdomen: 25,
		...frontLegs(-55),
		...ant(-40),
		...wing1(-80)
	}, -.05),
	tame: tame(tripod(15, 10), {
		head: 20,
		thorax: 4,
		...ant(15),
		...frontLegs(20)
	}, { head: 5 }),
	feed: feed({
		head: 25,
		thorax: 6,
		...frontLegs(15)
	}, { mandible: -18 }, { mandible: -3 })
});
const swave = (k) => mul({
	seg0: 8,
	seg1: 14,
	seg2: 8,
	seg3: -8,
	seg4: -14,
	seg5: -8,
	seg6: 8,
	seg7: 14,
	seg8: 8,
	seg9: -8
}, k);
const SERPENT = fauna({
	idle: [
		{
			head: -2,
			seg0: 2,
			seg1: 3
		},
		{
			head: 2,
			seg8: 3,
			seg9: 4
		},
		{
			head: -1,
			seg0: -2,
			seg1: -3
		},
		.003,
		-.002,
		-.004
	],
	alert: [{
		head: -25,
		seg0: -15,
		seg1: -10,
		seg2: -4
	}, -.03],
	approach: { slither: loop4(swave(1), {
		head: 2,
		seg0: 2
	}, swave(-1), 0, -.004, 0) },
	melee: {
		strike: melee({
			head: -20,
			seg0: -18,
			seg1: -12,
			seg2: -6,
			seg3: 6,
			seg4: 8
		}, {
			head: 5,
			seg0: -5,
			seg1: 5,
			seg2: 12,
			seg3: 4,
			jaw: -20
		}, {
			head: 15,
			jaw: -42,
			seg0: 4,
			seg1: 2
		}, {
			head: -5,
			seg0: -10,
			seg1: -8
		}, [
			-.08,
			.4,
			.48,
			.12
		], [
			.01,
			-.03,
			-.01,
			0
		]),
		constrict: melee({
			...swave(1),
			head: -10
		}, {
			seg0: 20,
			seg1: 30,
			seg2: 35,
			seg3: 30,
			seg4: 20,
			seg5: 10,
			head: 10
		}, {
			seg0: 30,
			seg1: 42,
			seg2: 44,
			seg3: 40,
			seg4: 32,
			seg5: 25,
			seg6: 15,
			head: 20,
			jaw: -10
		}, {
			seg0: 15,
			seg1: 20,
			seg2: 22,
			seg3: 20,
			seg4: 15,
			head: 8
		}, [
			-.05,
			.3,
			.34,
			.14
		], [
			.01,
			-.02,
			0,
			0
		])
	},
	cast: cast({
		head: -30,
		seg0: -30,
		seg1: -25,
		seg2: -15,
		seg3: -5
	}, {
		head: -32,
		seg0: -30,
		seg1: -25,
		seg2: -15,
		seg3: -5,
		jaw: -8
	}, {
		head: 25,
		jaw: -30,
		seg0: 5,
		seg1: 5
	}),
	hit: hit({
		head: -28,
		seg0: -12,
		seg1: 6,
		seg2: 10,
		seg3: 6
	}, {
		head: -10,
		seg0: -5,
		...swave(-.4)
	}, .012),
	dodge: dodge({
		head: -15,
		seg0: -20,
		seg1: -15,
		seg2: -5,
		seg3: 10,
		seg4: 12
	}, -.2, -.02),
	faint: faint({
		head: 10,
		seg0: 8
	}, {
		root: 8,
		head: 30,
		seg0: 12,
		...swave(.3)
	}, .04, .12),
	victory: victory({
		head: -35,
		seg0: -35,
		seg1: -30,
		seg2: -18,
		seg3: -6
	}, {
		head: -45,
		jaw: -20,
		seg0: -30,
		seg1: -25,
		seg2: -18,
		seg3: -6
	}),
	tame: tame(swave(.5), {
		head: 20,
		seg0: 8
	}, { head: 6 }),
	feed: feed({
		head: 25,
		seg0: 8
	}, { jaw: -30 }, { jaw: -5 })
});
const tetA = [
	"leg1Far",
	"leg2Near",
	"leg3Far",
	"leg4Near"
];
const tetB = [
	"leg1Near",
	"leg2Far",
	"leg3Near",
	"leg4Far"
];
const tetrapod = (k, f) => ({
	...legSet(tetA, -k, f),
	...legSet(tetB, k, -f)
});
const allLegs8 = (knee, foot) => legSet([...tetA, ...tetB], knee, foot);
const leg1 = (knee, foot = 0) => legSet(["leg1Far", "leg1Near"], knee, foot);
const leg2 = (knee, foot = 0) => legSet(["leg2Far", "leg2Near"], knee, foot);
const chel = (v) => pair("chelicera", v);
const ARACHNID = fauna({
	idle: [
		{
			abdomen: 3,
			...chel(-3)
		},
		{
			cephalothorax: -1,
			abdomen: -2
		},
		{
			abdomen: -3,
			...chel(3)
		},
		.003,
		-.002,
		-.006
	],
	alert: [{
		cephalothorax: -5,
		abdomen: 10,
		sting: -20,
		...chel(-20),
		...leg1(-30)
	}, -.01],
	approach: { scuttle: loop4(tetrapod(25, 15), {
		...allLegs8(-4, 6),
		cephalothorax: -1
	}, tetrapod(-25, -15), 0, -.006, .003) },
	melee: {
		sting: melee({
			abdomen: 20,
			sting: 25,
			cephalothorax: 3,
			...leg1(-15)
		}, {
			abdomen: 55,
			sting: 50,
			cephalothorax: -6,
			...leg1(-25)
		}, {
			abdomen: 62,
			sting: 68,
			cephalothorax: -10,
			...leg1(-35, -10)
		}, {
			abdomen: 20,
			sting: 10
		}, [
			-.04,
			.18,
			.26,
			.08
		], [
			.02,
			-.02,
			-.01,
			.01
		]),
		bite: melee({
			cephalothorax: 6,
			...chel(-30),
			...leg1(-25)
		}, {
			cephalothorax: -4,
			...chel(-10),
			...leg1(-10)
		}, {
			cephalothorax: 8,
			...chel(40),
			...leg1(20, -10)
		}, {
			cephalothorax: 2,
			...chel(5)
		}, [
			-.04,
			.26,
			.32,
			.1
		], [
			.02,
			-.03,
			-.01,
			.01
		])
	},
	cast: cast({
		cephalothorax: -12,
		...leg1(-60, 10),
		...leg2(-35, 10),
		abdomen: 25,
		sting: 30
	}, {
		cephalothorax: -12,
		...leg1(-62, 10),
		...leg2(-38, 10),
		abdomen: 28,
		sting: 34,
		...chel(-15)
	}, {
		cephalothorax: 10,
		...chel(30),
		...leg1(10),
		abdomen: -10,
		sting: -10
	}, -.04),
	hit: hit({
		cephalothorax: -10,
		abdomen: -15,
		sting: -25,
		...chel(20),
		...leg1(-10)
	}, {
		...legSet(["leg4Far", "leg4Near"], -20, 25),
		cephalothorax: -4,
		abdomen: -5
	}, .012),
	dodge: dodge({
		...allLegs8(30, -35),
		cephalothorax: -5,
		abdomen: -8
	}, -.22, -.03),
	faint: faint({
		...allLegs8(40, -50),
		cephalothorax: 3
	}, {
		root: 10,
		cephalothorax: 5,
		...allLegs8(60, -70),
		abdomen: 15,
		sting: 20,
		...chel(15)
	}, .05, .14),
	victory: victory({
		cephalothorax: -14,
		...leg1(-60, 10),
		...leg2(-40, 10),
		abdomen: 35,
		sting: 45,
		...chel(-30)
	}, {
		cephalothorax: -12,
		...leg1(-60, 10),
		...leg2(-40, 10),
		abdomen: 35,
		sting: 60,
		...chel(30)
	}, -.05),
	tame: tame(tetrapod(15, 10), {
		cephalothorax: 12,
		...leg1(15),
		...chel(10),
		abdomen: -5
	}, { cephalothorax: 4 }),
	feed: feed({
		cephalothorax: 15,
		...leg1(20)
	}, {
		cheliceraFar: -20,
		cheliceraNear: 20
	}, {
		cheliceraFar: -4,
		cheliceraNear: 4
	})
});
const splay = (s0, s1, s2) => Object.fromEntries([
	0,
	1,
	2,
	3,
	4,
	5
].flatMap((n) => {
	const k = n % 2 === 0 ? 1 : -1;
	return [
		["arm" + n + "Seg0", s0 * k],
		["arm" + n + "Seg1", s1 * k],
		["arm" + n + "Seg2", s2 * k]
	];
}));
const RADIAL = fauna({
	idle: [
		{
			bell: 3,
			...splay(3, 4, 5)
		},
		{
			bell: -4,
			centre: 1,
			...splay(-2, -3, -4)
		},
		{
			bell: 3,
			...splay(2, 3, 4)
		},
		0,
		-.006,
		-.012
	],
	alert: [{
		bell: -12,
		centre: -3,
		...splay(-15, -20, -25)
	}, -.02],
	approach: {
		drift: loop4({
			...splay(6, 9, 12),
			bell: 2
		}, {
			...splay(-3, -5, -8),
			bell: -3
		}, {
			...splay(5, 8, 11),
			bell: 2
		}, .02, -.02, -.03),
		pulse: [
			P(.3, "ease-in", {
				bell: -18,
				centre: -2,
				...splay(-30, -35, -40)
			}, 0, -.1),
			P(.6, "ease-out", {
				bell: 15,
				centre: 2,
				...splay(20, 25, 30)
			}, 0, -.04),
			P(.85, "sine-in-out", {
				bell: 4,
				...splay(8, 10, 12)
			}, 0, -.02),
			P(1, "sine-in-out", REST, 0, -.01)
		]
	},
	melee: { "sting-arms": melee({
		bell: -10,
		...splay(-20, -30, -35)
	}, {
		bell: 15,
		root: 10,
		...splay(35, 45, 50)
	}, {
		root: 14,
		bell: 12,
		...splay(40, 52, 55)
	}, {
		bell: 4,
		...splay(10, 15, 20)
	}, [
		-.03,
		.22,
		.28,
		.08
	], [
		.01,
		-.02,
		-.01,
		0
	]) },
	cast: cast({
		bell: -20,
		root: -15,
		...splay(-30, -40, -45)
	}, {
		bell: -22,
		root: -15,
		...splay(-32, -42, -48)
	}, {
		bell: 18,
		root: 5,
		...splay(30, 40, 45)
	}, -.08),
	hit: hit({
		bell: 12,
		centre: -8,
		root: -12,
		...splay(-15, -25, -30)
	}, {
		root: -6,
		...splay(10, 15, 20)
	}),
	dodge: dodge({
		bell: -15,
		root: -20,
		...splay(-25, -35, -40)
	}, -.2, -.06),
	faint: faint({
		bell: 10,
		...splay(15, 20, 25)
	}, {
		root: 30,
		bell: 20,
		...splay(30, 40, 45)
	}, .06, .18),
	victory: victory({
		bell: -20,
		root: -25,
		...splay(-35, -45, -50)
	}, {
		bell: 15,
		root: -10,
		...splay(30, 45, 50)
	}, -.1),
	tame: tame({
		...splay(6, 9, 12),
		bell: 2
	}, {
		bell: 8,
		...splay(15, 20, 25)
	}, { bell: 3 }),
	feed: feed({
		bell: 5,
		...splay(30, 40, 45)
	}, splay(40, 52, 55), splay(25, 35, 40))
});
const myA = [
	"legAFar",
	"legBNear",
	"legCFar",
	"legDNear"
];
const myB = [
	"legANear",
	"legBFar",
	"legCNear",
	"legDFar"
];
const mtripod = (k, f) => ({
	...legSet(myA, -k, f),
	...legSet(myB, k, -f)
});
const allLegsM = (knee, foot) => legSet([...myA, ...myB], knee, foot);
const legA = (knee, foot = 0) => legSet(["legAFar", "legANear"], knee, foot);
const mwave = (k) => mul({
	seg0: 6,
	seg1: 10,
	seg2: 6,
	seg3: -6,
	seg4: -10,
	seg5: -6,
	seg6: 6,
	seg7: 10
}, k);
const MYRIAPOD = fauna({
	idle: [
		{
			...mwave(.3),
			...ant(-3)
		},
		{
			head: -2,
			seg7: 3
		},
		{
			...mwave(-.3),
			...ant(3)
		},
		.003,
		-.002,
		-.005
	],
	alert: [{
		head: -15,
		...ant(-30),
		seg0: -8,
		seg1: -4,
		...legA(-20)
	}, -.008],
	approach: { crawl: loop4({
		...mtripod(22, 12),
		...mwave(.6)
	}, allLegsM(-3, 5), {
		...mtripod(-22, -12),
		...mwave(-.6)
	}, 0, -.005, .003) },
	melee: {
		mandible: melee({
			head: -14,
			seg0: -10,
			seg1: -6,
			...legA(-25)
		}, {
			head: 12,
			mandible: -20,
			seg0: 6,
			...legA(-10)
		}, {
			head: 20,
			mandible: -38,
			seg0: 8,
			seg1: 4,
			...legA(28, -10)
		}, {
			head: 2,
			...legA(5)
		}, [
			-.04,
			.28,
			.34,
			.1
		], [
			.02,
			-.03,
			-.01,
			.01
		]),
		sting: melee(mwave(.5), {
			seg5: 20,
			seg6: 35,
			seg7: 45
		}, {
			seg4: 15,
			seg5: 30,
			seg6: 42,
			seg7: 55,
			head: -8
		}, {
			seg6: 10,
			seg7: 15
		}, [
			-.03,
			.2,
			.26,
			.08
		], [
			.01,
			-.02,
			-.01,
			0
		])
	},
	cast: cast({
		head: -18,
		seg0: -20,
		seg1: -12,
		...legA(-45, 10),
		...ant(-15)
	}, {
		head: -20,
		seg0: -22,
		seg1: -12,
		...legA(-48, 10),
		...ant(-25)
	}, {
		head: 18,
		mandible: -15,
		seg0: 6,
		...legA(10)
	}, -.04),
	hit: hit({
		head: -20,
		seg0: 8,
		seg1: 10,
		seg2: 6,
		...ant(25),
		...legA(-10)
	}, {
		head: -6,
		...mwave(-.4)
	}, .01),
	dodge: dodge({
		...allLegsM(28, -32),
		head: -5,
		...mwave(.8)
	}, -.22, -.03),
	faint: faint({
		...allLegsM(35, -45),
		head: 6
	}, {
		root: 10,
		head: 20,
		...allLegsM(55, -65),
		...mwave(.3),
		...ant(30)
	}, .05, .14),
	victory: victory({
		head: -25,
		seg0: -25,
		seg1: -15,
		seg2: -6,
		...legA(-55, 10),
		...ant(-35)
	}, {
		head: -32,
		mandible: -15,
		seg0: -25,
		seg1: -15,
		seg2: -6,
		...legA(-55, 10),
		...ant(-45)
	}, -.05),
	tame: tame(mtripod(12, 8), {
		head: 18,
		seg0: 6,
		...ant(12),
		...legA(15)
	}, { head: 5 }),
	feed: feed({
		head: 22,
		seg0: 6,
		...legA(12)
	}, { mandible: -20 }, { mandible: -3 })
});
const csplay = (s0, s1, s2) => Object.fromEntries(cephArmsA.flatMap((a, n) => {
	const k = n < 4 ? -1 : 1;
	return [
		[a + "Seg0", s0 * k],
		[a + "Seg1", s1 * k],
		[a + "Seg2", s2 * k]
	];
}));
const calt = (s0, s1, s2) => Object.fromEntries(cephArmsA.flatMap((a, n) => {
	const k = n % 2 === 0 ? 1 : -1;
	return [
		[a + "Seg0", s0 * k],
		[a + "Seg1", s1 * k],
		[a + "Seg2", s2 * k]
	];
}));
const front = (a, b, c) => ({
	arm3Seg0: a,
	arm3Seg1: b,
	arm3Seg2: c,
	arm4Seg0: a,
	arm4Seg1: b,
	arm4Seg2: c
});
const fins = (v) => ({
	finFar: -v,
	finNear: v
});
const eyes = (v) => ({
	eyeFar: v,
	eyeNear: v
});
const CEPHALOPOD = fauna({
	idle: [
		{
			mantle: 2,
			...csplay(3, 4, 5)
		},
		{
			head: -2,
			...fins(6),
			siphon: -4
		},
		{
			mantle: -2,
			...csplay(-2, -3, -4)
		},
		.002,
		-.005,
		-.01
	],
	alert: [{
		mantle: -10,
		head: -5,
		...csplay(-15, -20, -25),
		...eyes(-8),
		...fins(20)
	}, -.02],
	approach: {
		jet: [
			P(.3, "ease-in", {
				mantle: -12,
				siphon: 25,
				...csplay(-28, -34, -40)
			}, 0, -.06),
			P(.6, "ease-out", {
				mantle: 10,
				siphon: -10,
				...csplay(18, 24, 30),
				...fins(15)
			}, .3, -.12),
			P(.85, "sine-in-out", {
				mantle: 3,
				...csplay(6, 8, 10)
			}, .45, -.05),
			P(1, "sine-in-out", REST, 0, -.02)
		],
		crawl: loop4(calt(20, 25, 30), {
			mantle: -2,
			...fins(5)
		}, calt(-20, -25, -30), 0, -.004, .002)
	},
	melee: {
		lash: melee({
			mantle: -6,
			...front(-40, -50, -55),
			...eyes(-5)
		}, {
			mantle: 8,
			root: 6,
			...front(45, 60, 70)
		}, {
			root: 10,
			mantle: 10,
			...front(40, 60, -80)
		}, {
			mantle: 3,
			...front(10, 15, 20)
		}, [
			-.04,
			.28,
			.34,
			.1
		], [
			.02,
			-.03,
			-.01,
			.01
		]),
		bite: melee({
			head: -10,
			mantle: -4,
			...csplay(-10, -15, -20)
		}, {
			head: 8,
			root: 4,
			...csplay(15, 20, 25)
		}, {
			head: 15,
			root: 8,
			...csplay(25, 35, 40),
			...eyes(6)
		}, { head: 2 }, [
			-.04,
			.26,
			.32,
			.1
		], [
			.02,
			-.03,
			-.01,
			.01
		])
	},
	cast: cast({
		mantle: -18,
		head: -8,
		...csplay(-30, -40, -45),
		...fins(25),
		siphon: 15
	}, {
		mantle: -20,
		head: -10,
		...csplay(-32, -42, -48),
		...fins(28),
		siphon: 18
	}, {
		mantle: 12,
		head: 6,
		...csplay(28, 38, 42),
		siphon: -20
	}, -.08),
	hit: hit({
		mantle: 12,
		head: -10,
		root: -10,
		...csplay(-12, -20, -25),
		...eyes(-8)
	}, {
		root: -5,
		...csplay(8, 12, 15)
	}),
	dodge: dodge({
		mantle: -12,
		root: -18,
		siphon: 30,
		...csplay(-25, -35, -40)
	}, -.22, -.07),
	faint: faint({
		mantle: 8,
		...csplay(12, 18, 22)
	}, {
		root: 28,
		mantle: 18,
		head: 10,
		...csplay(28, 38, 45),
		...fins(-15)
	}, .06, .18),
	victory: victory({
		mantle: -18,
		root: -22,
		...csplay(-35, -45, -50),
		...fins(30)
	}, {
		mantle: 12,
		root: -8,
		...csplay(30, 42, 50),
		...fins(35),
		...eyes(10)
	}, -.1),
	tame: tame({
		...csplay(5, 8, 10),
		mantle: 2
	}, {
		head: 8,
		...csplay(14, 20, 24)
	}, { head: 3 }),
	feed: feed({
		head: 5,
		...csplay(28, 38, 42)
	}, csplay(40, 50, 55), csplay(24, 32, 38))
});
const bw = (root, elbow, wrist, tip) => ({
	...pair("wing", root, "Root"),
	...pair("wing", elbow, "Elbow"),
	...pair("wing", wrist, "Wrist"),
	...pair("wing", tip, "Tip")
});
const bl = (knee, foot) => ({
	...pair("leg", knee, "Knee"),
	...pair("leg", foot, "Foot")
});
const bears = (v) => pair("ear", v, "Tip");
const FLYER = fauna({
	idle: [
		{
			spine: -1,
			chest: -2,
			...bw(2, -2, 0, 0)
		},
		{
			neck: -2,
			head: 1,
			...bears(-3)
		},
		{
			...bw(-2, 2, 0, 0),
			tail0: 2
		},
		.003,
		-.004,
		-.01
	],
	alert: [{
		neck: -14,
		head: -10,
		...bears(-25),
		...bw(20, -10, 0, 5),
		spine: -3
	}, -.01],
	approach: {
		flight: [
			P(.25, "sine-in-out", {
				...bw(70, -30, -20, -10),
				...bl(30, -30),
				spine: -6,
				neck: 4
			}, 0, -.12),
			P(.5, "sine-in-out", {
				...bw(10, 10, 15, 20),
				...bl(30, -30),
				spine: -4
			}, 0, -.16),
			P(.75, "sine-in-out", {
				...bw(-50, 40, 35, 30),
				...bl(30, -30),
				spine: 2,
				neck: -3
			}, 0, -.12),
			P(1, "sine-in-out", {
				...bw(20, 0, 0, 5),
				...bl(30, -30),
				spine: -4
			}, 0, -.1)
		],
		crawl: loop4({
			...bw(-30, 30, 20, 10),
			...bl(-20, 15),
			spine: 4
		}, {
			...bw(-25, 25, 15, 5),
			...bl(0, 10)
		}, {
			...bw(-35, 35, 25, 15),
			...bl(20, -15),
			spine: 4
		}, 0, -.006, .004)
	},
	melee: {
		bite: melee({
			neck: -20,
			head: -16,
			spine: -4,
			...bw(30, -15, 0, 0),
			...bears(-15)
		}, {
			neck: 22,
			head: 14,
			jaw: -15,
			spine: 6,
			...bw(45, -10, 0, 5)
		}, {
			neck: 30,
			head: 20,
			jaw: -35,
			spine: 8,
			...bw(50, -5, 0, 10)
		}, {
			neck: -4,
			head: 2
		}, [
			-.03,
			.26,
			.3,
			.08
		]),
		claw: melee({
			...bl(-30, 20),
			spine: -6,
			...bw(35, -15, 0, 0)
		}, {
			legNearKnee: -60,
			legNearFoot: 35,
			...bw(55, -10, 0, 5),
			spine: -8
		}, {
			legNearKnee: -68,
			legNearFoot: 48,
			...bw(60, -5, 0, 10),
			root: 6
		}, {
			legNearKnee: -15,
			legNearFoot: 10
		}, [
			-.04,
			.28,
			.32,
			.1
		], [
			.02,
			-.06,
			-.03,
			.01
		])
	},
	cast: cast({
		...bw(85, -40, -30, -20),
		spine: -12,
		neck: -10,
		tail0: -10
	}, {
		...bw(90, -45, -35, -25),
		spine: -12,
		neck: -12,
		head: -5,
		...bears(-10)
	}, {
		...bw(-20, 20, 15, 10),
		neck: 15,
		head: 20,
		jaw: -15,
		spine: -6
	}, -.05),
	hit: hit({
		neck: -15,
		head: -18,
		spine: 8,
		chest: -5,
		...bw(25, -10, 0, 0),
		...bears(12),
		tail0: 10
	}, {
		neck: -6,
		head: -6,
		legFarKnee: -15,
		legFarFoot: 20,
		spine: 3
	}),
	dodge: dodge({
		...bl(20, -30),
		...bw(40, -15, 0, 5),
		spine: -4
	}, -.25, -.06),
	faint: faint({
		...bl(40, -50),
		spine: 8,
		neck: 6,
		head: 6
	}, {
		...bl(30, -30),
		root: 14,
		spine: 10,
		neck: 22,
		head: 20,
		...bw(-30, -30, -20, -10),
		tail0: 20
	}, .08, .2),
	victory: victory({
		...bw(85, -45, -35, -25),
		spine: -15,
		neck: -10,
		head: -12,
		tail0: -15
	}, {
		...bw(90, -50, -40, -30),
		spine: -15,
		neck: -12,
		head: -30,
		jaw: -10,
		...bears(-20)
	}, -.04),
	tame: tame({
		...bl(-12, 10),
		head: -4
	}, {
		neck: 20,
		head: 18,
		...bw(-5, 0, 0, 0),
		spine: 2,
		...bears(-8)
	}, { head: 5 }),
	feed: feed({
		neck: 30,
		head: 20,
		spine: 4
	}, { jaw: -14 }, { jaw: -2 })
});
const pa = (sh, el, hand) => ({
	...pair("arm", sh, "Shoulder"),
	...pair("arm", el, "Elbow"),
	...pair("arm", hand, "Hand")
});
const pl = (hip, knee, foot) => ({
	...pair("leg", hip, "Hip"),
	...pair("leg", knee, "Knee"),
	...pair("leg", foot, "Foot")
});
const alt = (base, v, suffix) => ({
	[base + "Far" + suffix]: -v,
	[base + "Near" + suffix]: v
});
const tail3 = (a, b, c) => ({
	tail0: a,
	tail1: b,
	tail2: c
});
const climbA = {
	armFarShoulder: -70,
	armFarElbow: 45,
	armNearShoulder: -40,
	armNearElbow: 30,
	legFarHip: 20,
	legFarKnee: -45,
	legNearHip: 40,
	legNearKnee: -60,
	spine: -6
};
const climbB = {
	armFarShoulder: -40,
	armFarElbow: 30,
	armNearShoulder: -70,
	armNearElbow: 45,
	legFarHip: 40,
	legFarKnee: -60,
	legNearHip: 20,
	legNearKnee: -45,
	spine: -6
};
const PRIMATE = fauna({
	idle: [
		{
			spine: -2,
			chest: -1,
			...tail3(3, 4, 5)
		},
		{
			neck: -2,
			head: 2,
			...pa(2, -3, 0)
		},
		{
			spine: 1,
			...tail3(-3, -4, -5)
		},
		.003,
		-.003,
		-.008
	],
	alert: [{
		neck: -12,
		head: -10,
		spine: -6,
		chest: -4,
		...pa(-20, -15, 0),
		...tail3(-15, -10, -5)
	}, -.01],
	approach: {
		walk: loop4({
			...pa(0, 10, 0),
			...pl(0, -15, 5),
			...alt("arm", 25, "Shoulder"),
			...alt("leg", 25, "Hip"),
			spine: 3
		}, {
			...pa(0, 15, 0),
			...pl(0, -10, 10)
		}, {
			...pa(0, 10, 0),
			...pl(0, -15, 5),
			...alt("arm", -25, "Shoulder"),
			...alt("leg", -25, "Hip"),
			spine: 3
		}, 0, -.008, .004),
		climb: loop4(climbA, {
			...pa(-50, 35, 0),
			...pl(30, -50, 10),
			spine: -4
		}, climbB, 0, -.05, -.03)
	},
	melee: {
		punch: melee({
			armNearShoulder: 35,
			armNearElbow: -80,
			spine: -6,
			chest: -4,
			...pl(10, -15, 0)
		}, {
			armNearShoulder: -60,
			armNearElbow: -20,
			armNearHand: -10,
			spine: 8,
			chest: 6
		}, {
			armNearShoulder: -75,
			armNearElbow: -5,
			armNearHand: -20,
			spine: 10,
			chest: 8,
			root: 4,
			head: 4
		}, {
			armNearShoulder: -20,
			armNearElbow: -25,
			spine: 3
		}, [
			-.05,
			.3,
			.36,
			.1
		], [
			.02,
			-.03,
			-.01,
			.01
		]),
		bite: melee({
			neck: -18,
			head: -14,
			spine: -6,
			...pa(-15, -20, 0)
		}, {
			neck: 18,
			head: 12,
			jaw: -14,
			spine: 8,
			...pa(-30, -15, 0)
		}, {
			neck: 26,
			head: 18,
			jaw: -32,
			spine: 10,
			...pa(-35, -10, 0)
		}, {
			neck: -3,
			head: 2
		}, [
			-.04,
			.26,
			.32,
			.1
		])
	},
	cast: cast({
		...pa(-95, -30, -20),
		spine: -15,
		chest: -10,
		neck: -10,
		head: -8,
		...tail3(-10, -8, -5)
	}, {
		...pa(-100, -35, -25),
		spine: -15,
		chest: -10,
		neck: -12,
		head: -10
	}, {
		...pa(-40, -10, 15),
		neck: 12,
		head: 15,
		jaw: -10,
		spine: 4
	}, -.06),
	hit: hit({
		neck: -16,
		head: -18,
		spine: 8,
		chest: -6,
		...pa(20, -25, 0),
		...tail3(10, 8, 5)
	}, {
		neck: -6,
		head: -6,
		spine: 3,
		...pl(-10, -15, 10)
	}),
	dodge: dodge({
		...pl(25, -40, 10),
		...pa(-30, -20, 0),
		spine: -6,
		neck: -6
	}, -.25, -.05),
	faint: faint({
		...pl(30, -45, 10),
		...pa(20, -30, 0),
		spine: 8,
		head: 6
	}, {
		...pl(40, -30, 20),
		...pa(35, -40, 10),
		root: 14,
		spine: 12,
		neck: 22,
		head: 26,
		...tail3(15, 12, 8)
	}, .08, .2),
	victory: victory({
		...pa(-100, -40, -20),
		spine: -18,
		chest: -10,
		neck: -8,
		head: -12,
		...tail3(-12, -10, -6)
	}, {
		...pa(-100, -45, -25),
		spine: -18,
		chest: -10,
		neck: -12,
		head: -28,
		jaw: -12,
		...tail3(-16, -12, -8)
	}, -.06),
	tame: tame({
		...pl(-10, -12, 5),
		head: -4,
		...pa(-8, -10, 0)
	}, {
		neck: 20,
		head: 18,
		spine: 3,
		...pa(-15, -30, 10),
		...tail3(4, 3, 2)
	}, { head: 5 }),
	feed: feed({
		neck: 24,
		head: 18,
		...pa(-40, -70, 15)
	}, { jaw: -14 }, { jaw: -2 })
});
const wsway = (k) => ({
	trunk: .3 * k,
	...Object.fromEntries([
		0,
		1,
		2
	].flatMap((n) => {
		const s = n === 1 ? -1 : 1;
		return [
			["branch" + n + "Base", k * s],
			["branch" + n + "Tip", 1.5 * k * s],
			["leaf" + n, 2 * k * s]
		];
	}))
});
const hsway = (k) => Object.fromEntries([
	0,
	1,
	2,
	3
].flatMap((n) => {
	const s = n % 2 === 0 ? 1 : -1;
	return [
		["stem" + n + "Seg0", .6 * k * s],
		["stem" + n + "Seg1", k * s],
		["stem" + n + "Seg2", 1.4 * k * s],
		["frond" + n, 2 * k * s]
	];
}));
const plant = (sway, leaves) => Object.freeze(Object.fromEntries([
	A("sway", "sway", [
		P(.25, "sine-in-out", sway(6)),
		P(.5, "sine-in-out", sway(1)),
		P(.75, "sine-in-out", sway(-5)),
		P(1, "sine-in-out", REST)
	], true),
	A("disturb", "disturb", [
		P(tAt("disturb", "recoil"), "ease-out", {
			...sway(-14),
			...mul(leaves, -1)
		}, -.01),
		P(tAt("disturb", "settle", .5), "sine-in-out", sway(6)),
		P(1, "back-out", REST)
	]),
	A("harvest", "harvest", [
		P(tAt("harvest", "shake"), "ease-in", sway(12)),
		P(tAt("harvest", "detach"), "ease-out", {
			...sway(-10),
			...leaves
		}, 0, .004),
		P(tAt("harvest", "settle", .5), "sine-in-out", sway(4)),
		P(1, "back-out", REST)
	]),
	A("grow", "grow", [
		P(.02, "ease-out", mul(leaves, -1.2), 0, .3),
		P(tAt("grow", "rise"), "ease-out", mul(leaves, -.4), 0, -.03),
		P(tAt("grow", "overshoot"), "back-out", {
			...sway(3),
			...mul(leaves, .3)
		}, 0, -.05),
		P(1, "sine-in-out", REST)
	])
].map((a) => [a.id, a])));
const WOODY = plant(wsway, {
	leaf0: 30,
	leaf1: -30,
	leaf2: 30
});
const HERB = plant(hsway, {
	frond0: 35,
	frond1: -35,
	frond2: 35,
	frond3: -35
});
Object.freeze({
	quadruped: QUADRUPED_ACTIONS,
	hopper: HOPPER,
	"biped-bird": BIRD,
	fish: FISH,
	insect: INSECT,
	serpent: SERPENT,
	arachnid: ARACHNID,
	radial: RADIAL,
	"plant-woody": WOODY,
	"plant-herb": HERB,
	myriapod: MYRIAPOD,
	cephalopod: CEPHALOPOD,
	"flyer-membrane": FLYER,
	primate: PRIMATE
});
Object.freeze({
	hopper: { claw: "kick" },
	insect: { bite: "mandible" },
	serpent: { bite: "strike" },
	radial: {
		sting: "sting-arms",
		tail: "sting-arms",
		bite: "sting-arms"
	},
	fish: {},
	"biped-bird": {},
	arachnid: {},
	quadruped: {},
	myriapod: { bite: "mandible" },
	cephalopod: {
		constrict: "lash",
		tail: "lash"
	},
	"flyer-membrane": {},
	primate: { claw: "punch" }
});
Object.freeze({
	furred: {
		lagS: .08,
		overshoot: .2,
		damping: .55,
		squash: 0,
		stretch: 0,
		rigid: false
	},
	feathered: {
		lagS: .06,
		overshoot: .25,
		damping: .5,
		squash: 0,
		stretch: 0,
		rigid: false,
		flutter: true,
		crestLift: true
	},
	scaled: {
		lagS: .05,
		overshoot: .05,
		damping: .8,
		squash: 0,
		stretch: 0,
		rigid: false
	},
	slick: {
		lagS: .06,
		overshoot: .15,
		damping: .6,
		squash: .06,
		stretch: .04,
		rigid: false
	},
	warty: {
		lagS: .06,
		overshoot: .15,
		damping: .6,
		squash: .06,
		stretch: .04,
		rigid: false
	},
	chitinous: {
		lagS: 0,
		overshoot: 0,
		damping: 1,
		squash: 0,
		stretch: 0,
		rigid: true,
		quiverS: .04
	},
	plated: {
		lagS: 0,
		overshoot: 0,
		damping: 1,
		squash: 0,
		stretch: 0,
		rigid: true,
		heavySettle: true
	},
	crystalline: {
		lagS: 0,
		overshoot: 0,
		damping: 1,
		squash: 0,
		stretch: 0,
		rigid: true,
		glintOnStrike: true
	},
	translucent: {
		lagS: .12,
		overshoot: .35,
		damping: .35,
		squash: .03,
		stretch: .02,
		rigid: false,
		wobbleS: .12,
		wobbleCycles: 2
	}
});
Object.freeze({
	idleMs: 1800,
	strikeMs: 120
});
Object.freeze({
	land: {
		damping: 1,
		bobMs: 0,
		drift: false
	},
	amphibious: {
		damping: .9,
		bobMs: 0,
		drift: false
	},
	aquatic: {
		damping: .75,
		bobMs: 0,
		drift: true
	},
	aerial: {
		damping: 1,
		bobMs: 1400,
		drift: false
	},
	"gas-giant": {
		damping: .85,
		bobMs: 0,
		drift: true
	}
});
Object.freeze({
	wing: { flutterS: .06 },
	tailfan: { flutterS: .06 },
	fin: {
		lagS: .05,
		overshoot: .1
	},
	antenna: { quiverS: .04 },
	frond: {
		lagS: .05,
		overshoot: .15
	},
	bell: {
		wobbleS: .12,
		overshoot: .3
	},
	arm: { lagS: .06 },
	membrane: {
		lagS: .04,
		overshoot: .05
	},
	tentacle: {
		lagS: .07,
		overshoot: .2
	},
	tail: {},
	ear: {}
});
Object.freeze([
	"body",
	"head",
	"legs",
	"tail",
	"ears",
	"wings",
	"fins",
	"antennae",
	"fronds",
	"arms"
]);
Object.freeze({
	"Civet": {
		gait: "walk",
		loco: "climbers",
		mass: "small",
		weapons: ["bite", "claw"]
	},
	"Red Fox": {
		gait: "trot",
		loco: "runners",
		mass: "medium",
		weapons: ["bite", "claw"]
	}
});
Object.freeze({
	gait: "walk",
	loco: null,
	mass: "medium",
	weapons: ["bite", "claw"]
});
Object.freeze({
	"grazers": "walk",
	"burrowers": "walk",
	"pack hunters": "trot",
	"gliders": "glide",
	"swimmers": "swim",
	"floaters": "drift",
	"ambush predators": "walk",
	"climbers": "walk",
	"herd-beasts": "trot",
	"filter-feeders": "drift",
	"leapers": "hop",
	"drifters": "drift",
	"runners": "gallop",
	"jet-propelled swimmers": "jet",
	"tentacle-walkers": "crawl",
	"rollers": "roll",
	"wall-clingers": "cling-crawl",
	"current-drifters": "drift"
});
Object.freeze({
	"fanged": "bite",
	"horned": "gore",
	"beaked": "peck",
	"mandibled": "bite",
	"domed and bulbous": "headbutt"
});
Object.freeze({
	"whip-like": "tail",
	"spiked": "tail",
	"stinger-tipped": "sting"
});
Object.freeze({
	quadruped: ["bite", "claw"],
	hopper: ["bite", "claw"],
	"biped-bird": ["peck", "claw"],
	fish: ["bite"],
	insect: ["bite"],
	serpent: ["bite", "constrict"],
	arachnid: ["sting", "bite"],
	radial: ["sting"],
	"plant-woody": [],
	"plant-herb": [],
	myriapod: ["bite", "sting"],
	cephalopod: ["constrict", "bite"],
	"flyer-membrane": ["bite", "claw"],
	primate: ["claw", "bite"]
});
Object.freeze({
	"biped-bird": {
		fly: "flight",
		glide: "flight"
	},
	insect: {
		fly: "flight",
		glide: "flight"
	},
	radial: {
		jet: "pulse",
		swim: "pulse"
	},
	fish: {
		jet: "swim",
		drift: "swim"
	},
	serpent: {
		crawl: "slither",
		swim: "slither"
	},
	arachnid: {
		crawl: "scuttle",
		walk: "scuttle",
		"cling-crawl": "scuttle"
	},
	hopper: {},
	myriapod: {
		walk: "crawl",
		"cling-crawl": "crawl",
		trot: "crawl"
	},
	cephalopod: {
		swim: "jet",
		drift: "jet",
		walk: "crawl",
		"cling-crawl": "crawl"
	},
	"flyer-membrane": {
		fly: "flight",
		glide: "flight",
		walk: "crawl",
		"cling-crawl": "crawl"
	},
	primate: {
		"cling-crawl": "climb",
		crawl: "walk",
		trot: "walk",
		gallop: "walk"
	}
});
//#endregion
//#region ../celestial-frontier-anthropic-mac/port/v2/apps/game/src/motion/timeline.ts
/** The frozen easing family; numerically identical to gsap power1.out / power1.in / back.out(1.70158) / sine.inOut. */
const EASE_FN = Object.freeze({
	"ease-out": (t) => 1 - (1 - t) * (1 - t),
	"ease-in": (t) => t * t,
	"back-out": (t) => {
		const s = 1.70158, p = t - 1;
		return p * p * (2.70158 * p + s) + 1;
	},
	"sine-in-out": (t) => -(Math.cos(Math.PI * t) - 1) / 2
});
function sampleKeys(keys, ms) {
	const first = keys[0], last = keys[keys.length - 1];
	if (!first || !last) return 0;
	if (ms <= first.ms) return first.value;
	if (ms >= last.ms) return last.value;
	for (let i = 1; i < keys.length; i++) {
		const a = keys[i - 1], b = keys[i];
		if (ms <= b.ms) {
			const span = b.ms - a.ms;
			return span <= 0 ? b.value : a.value + (b.value - a.value) * EASE_FN[b.ease]((ms - a.ms) / span);
		}
	}
	return last.value;
}
//#endregion
//#region ../celestial-frontier-anthropic-mac/port/v2/node_modules/gsap/gsap-core.js
function _assertThisInitialized(self) {
	if (self === void 0) throw new ReferenceError("this hasn't been initialised - super() hasn't been called");
	return self;
}
function _inheritsLoose(subClass, superClass) {
	subClass.prototype = Object.create(superClass.prototype);
	subClass.prototype.constructor = subClass;
	subClass.__proto__ = superClass;
}
/*!
* GSAP 3.15.0
* https://gsap.com
*
* @license Copyright 2008-2026, GreenSock. All rights reserved.
* Subject to the terms at https://gsap.com/standard-license
* @author: Jack Doyle, jack@greensock.com
*/
var _config = {
	autoSleep: 120,
	force3D: "auto",
	nullTargetWarn: 1,
	units: { lineHeight: "" }
};
var _defaults = {
	duration: .5,
	overwrite: false,
	delay: 0
};
var _suppressOverwrites;
var _reverting$1;
var _context;
var _bigNum$1 = 1e8;
var _tinyNum = 1 / _bigNum$1;
var _2PI = Math.PI * 2;
var _HALF_PI = _2PI / 4;
var _gsID = 0;
var _sqrt = Math.sqrt;
var _cos = Math.cos;
var _sin = Math.sin;
var _isString = function _isString(value) {
	return typeof value === "string";
};
var _isFunction = function _isFunction(value) {
	return typeof value === "function";
};
var _isNumber = function _isNumber(value) {
	return typeof value === "number";
};
var _isUndefined = function _isUndefined(value) {
	return typeof value === "undefined";
};
var _isObject = function _isObject(value) {
	return typeof value === "object";
};
var _isNotFalse = function _isNotFalse(value) {
	return value !== false;
};
var _windowExists$1 = function _windowExists() {
	return typeof window !== "undefined";
};
var _isFuncOrString = function _isFuncOrString(value) {
	return _isFunction(value) || _isString(value);
};
var _isTypedArray = typeof ArrayBuffer === "function" && ArrayBuffer.isView || function() {};
var _isArray = Array.isArray;
var _randomExp = /random\([^)]+\)/g;
var _commaDelimExp = /,\s*/g;
var _strictNumExp = /(?:-?\.?\d|\.)+/gi;
var _numExp = /[-+=.]*\d+[.e\-+]*\d*[e\-+]*\d*/g;
var _numWithUnitExp = /[-+=.]*\d+[.e-]*\d*[a-z%]*/g;
var _complexStringNumExp = /[-+=.]*\d+\.?\d*(?:e-|e\+)?\d*/gi;
var _relExp = /[+-]=-?[.\d]+/;
var _delimitedValueExp = /[^,'"\[\]\s]+/gi;
var _unitExp = /^[+\-=e\s\d]*\d+[.\d]*([a-z]*|%)\s*$/i;
var _globalTimeline;
var _win$1;
var _coreInitted;
var _doc$1;
var _globals = {};
var _installScope = {};
var _coreReady;
var _install = function _install(scope) {
	return (_installScope = _merge(scope, _globals)) && gsap;
};
var _missingPlugin = function _missingPlugin(property, value) {
	return console.warn("Invalid property", property, "set to", value, "Missing plugin? gsap.registerPlugin()");
};
var _warn = function _warn(message, suppress) {
	return !suppress && console.warn(message);
};
var _addGlobal = function _addGlobal(name, obj) {
	return name && (_globals[name] = obj) && _installScope && (_installScope[name] = obj) || _globals;
};
var _emptyFunc = function _emptyFunc() {
	return 0;
};
var _startAtRevertConfig = {
	suppressEvents: true,
	isStart: true,
	kill: false
};
var _revertConfigNoKill = {
	suppressEvents: true,
	kill: false
};
var _revertConfig = { suppressEvents: true };
var _reservedProps = {};
var _lazyTweens = [];
var _lazyLookup = {};
var _lastRenderedFrame;
var _plugins = {};
var _effects = {};
var _nextGCFrame = 30;
var _harnessPlugins = [];
var _callbackNames = "";
var _harness = function _harness(targets) {
	var target = targets[0], harnessPlugin, i;
	_isObject(target) || _isFunction(target) || (targets = [targets]);
	if (!(harnessPlugin = (target._gsap || {}).harness)) {
		i = _harnessPlugins.length;
		while (i-- && !_harnessPlugins[i].targetTest(target));
		harnessPlugin = _harnessPlugins[i];
	}
	i = targets.length;
	while (i--) targets[i] && (targets[i]._gsap || (targets[i]._gsap = new GSCache(targets[i], harnessPlugin))) || targets.splice(i, 1);
	return targets;
};
var _getCache = function _getCache(target) {
	return target._gsap || _harness(toArray(target))[0]._gsap;
};
var _getProperty = function _getProperty(target, property, v) {
	return (v = target[property]) && _isFunction(v) ? target[property]() : _isUndefined(v) && target.getAttribute && target.getAttribute(property) || v;
};
var _forEachName = function _forEachName(names, func) {
	return (names = names.split(",")).forEach(func) || names;
};
var _round = function _round(value) {
	return Math.round(value * 1e5) / 1e5 || 0;
};
var _roundPrecise = function _roundPrecise(value) {
	return Math.round(value * 1e7) / 1e7 || 0;
};
var _parseRelative = function _parseRelative(start, value) {
	var operator = value.charAt(0), end = parseFloat(value.substr(2));
	start = parseFloat(start);
	return operator === "+" ? start + end : operator === "-" ? start - end : operator === "*" ? start * end : start / end;
};
var _arrayContainsAny = function _arrayContainsAny(toSearch, toFind) {
	var l = toFind.length, i = 0;
	for (; toSearch.indexOf(toFind[i]) < 0 && ++i < l;);
	return i < l;
};
var _lazyRender = function _lazyRender() {
	var l = _lazyTweens.length, a = _lazyTweens.slice(0), i, tween;
	_lazyLookup = {};
	_lazyTweens.length = 0;
	for (i = 0; i < l; i++) {
		tween = a[i];
		tween && tween._lazy && (tween.render(tween._lazy[0], tween._lazy[1], true)._lazy = 0);
	}
};
var _isRevertWorthy = function _isRevertWorthy(animation) {
	return !!(animation._initted || animation._startAt || animation.add);
};
var _lazySafeRender = function _lazySafeRender(animation, time, suppressEvents, force) {
	_lazyTweens.length && !_reverting$1 && _lazyRender();
	animation.render(time, suppressEvents, force || !!(_reverting$1 && time < 0 && _isRevertWorthy(animation)));
	_lazyTweens.length && !_reverting$1 && _lazyRender();
};
var _numericIfPossible = function _numericIfPossible(value) {
	var n = parseFloat(value);
	return (n || n === 0) && (value + "").match(_delimitedValueExp).length < 2 ? n : _isString(value) ? value.trim() : value;
};
var _passThrough = function _passThrough(p) {
	return p;
};
var _setDefaults = function _setDefaults(obj, defaults) {
	for (var p in defaults) p in obj || (obj[p] = defaults[p]);
	return obj;
};
var _setKeyframeDefaults = function _setKeyframeDefaults(excludeDuration) {
	return function(obj, defaults) {
		for (var p in defaults) p in obj || p === "duration" && excludeDuration || p === "ease" || (obj[p] = defaults[p]);
	};
};
var _merge = function _merge(base, toMerge) {
	for (var p in toMerge) base[p] = toMerge[p];
	return base;
};
var _mergeDeep = function _mergeDeep(base, toMerge) {
	for (var p in toMerge) p !== "__proto__" && p !== "constructor" && p !== "prototype" && (base[p] = _isObject(toMerge[p]) ? _mergeDeep(base[p] || (base[p] = {}), toMerge[p]) : toMerge[p]);
	return base;
};
var _copyExcluding = function _copyExcluding(obj, excluding) {
	var copy = {}, p;
	for (p in obj) p in excluding || (copy[p] = obj[p]);
	return copy;
};
var _inheritDefaults = function _inheritDefaults(vars) {
	var parent = vars.parent || _globalTimeline, func = vars.keyframes ? _setKeyframeDefaults(_isArray(vars.keyframes)) : _setDefaults;
	if (_isNotFalse(vars.inherit)) while (parent) {
		func(vars, parent.vars.defaults);
		parent = parent.parent || parent._dp;
	}
	return vars;
};
var _arraysMatch = function _arraysMatch(a1, a2) {
	var i = a1.length, match = i === a2.length;
	while (match && i-- && a1[i] === a2[i]);
	return i < 0;
};
var _addLinkedListItem = function _addLinkedListItem(parent, child, firstProp, lastProp, sortBy) {
	if (firstProp === void 0) firstProp = "_first";
	if (lastProp === void 0) lastProp = "_last";
	var prev = parent[lastProp], t;
	if (sortBy) {
		t = child[sortBy];
		while (prev && prev[sortBy] > t) prev = prev._prev;
	}
	if (prev) {
		child._next = prev._next;
		prev._next = child;
	} else {
		child._next = parent[firstProp];
		parent[firstProp] = child;
	}
	if (child._next) child._next._prev = child;
	else parent[lastProp] = child;
	child._prev = prev;
	child.parent = child._dp = parent;
	return child;
};
var _removeLinkedListItem = function _removeLinkedListItem(parent, child, firstProp, lastProp) {
	if (firstProp === void 0) firstProp = "_first";
	if (lastProp === void 0) lastProp = "_last";
	var prev = child._prev, next = child._next;
	if (prev) prev._next = next;
	else if (parent[firstProp] === child) parent[firstProp] = next;
	if (next) next._prev = prev;
	else if (parent[lastProp] === child) parent[lastProp] = prev;
	child._next = child._prev = child.parent = null;
};
var _removeFromParent = function _removeFromParent(child, onlyIfParentHasAutoRemove) {
	child.parent && (!onlyIfParentHasAutoRemove || child.parent.autoRemoveChildren) && child.parent.remove && child.parent.remove(child);
	child._act = 0;
};
var _uncache = function _uncache(animation, child) {
	if (animation && (!child || child._end > animation._dur || child._start < 0)) {
		var a = animation;
		while (a) {
			a._dirty = 1;
			a = a.parent;
		}
	}
	return animation;
};
var _recacheAncestors = function _recacheAncestors(animation) {
	var parent = animation.parent;
	while (parent && parent.parent) {
		parent._dirty = 1;
		parent.totalDuration();
		parent = parent.parent;
	}
	return animation;
};
var _rewindStartAt = function _rewindStartAt(tween, totalTime, suppressEvents, force) {
	return tween._startAt && (_reverting$1 ? tween._startAt.revert(_revertConfigNoKill) : tween.vars.immediateRender && !tween.vars.autoRevert || tween._startAt.render(totalTime, true, force));
};
var _hasNoPausedAncestors = function _hasNoPausedAncestors(animation) {
	return !animation || animation._ts && _hasNoPausedAncestors(animation.parent);
};
var _elapsedCycleDuration = function _elapsedCycleDuration(animation) {
	return animation._repeat ? _animationCycle(animation._tTime, animation = animation.duration() + animation._rDelay) * animation : 0;
};
var _animationCycle = function _animationCycle(tTime, cycleDuration) {
	var whole = Math.floor(tTime = _roundPrecise(tTime / cycleDuration));
	return tTime && whole === tTime ? whole - 1 : whole;
};
var _parentToChildTotalTime = function _parentToChildTotalTime(parentTime, child) {
	return (parentTime - child._start) * child._ts + (child._ts >= 0 ? 0 : child._dirty ? child.totalDuration() : child._tDur);
};
var _setEnd = function _setEnd(animation) {
	return animation._end = _roundPrecise(animation._start + (animation._tDur / Math.abs(animation._ts || animation._rts || _tinyNum) || 0));
};
var _alignPlayhead = function _alignPlayhead(animation, totalTime) {
	var parent = animation._dp;
	if (parent && parent.smoothChildTiming && animation._ts) {
		animation._start = _roundPrecise(parent._time - (animation._ts > 0 ? totalTime / animation._ts : ((animation._dirty ? animation.totalDuration() : animation._tDur) - totalTime) / -animation._ts));
		_setEnd(animation);
		parent._dirty || _uncache(parent, animation);
	}
	return animation;
};
var _postAddChecks = function _postAddChecks(timeline, child) {
	var t;
	if (child._time || !child._dur && child._initted || child._start < timeline._time && (child._dur || !child.add)) {
		t = _parentToChildTotalTime(timeline.rawTime(), child);
		if (!child._dur || _clamp(0, child.totalDuration(), t) - child._tTime > _tinyNum) child.render(t, true);
	}
	if (_uncache(timeline, child)._dp && timeline._initted && timeline._time >= timeline._dur && timeline._ts) {
		if (timeline._dur < timeline.duration()) {
			t = timeline;
			while (t._dp) {
				t.rawTime() >= 0 && t.totalTime(t._tTime);
				t = t._dp;
			}
		}
		timeline._zTime = -_tinyNum;
	}
};
var _addToTimeline = function _addToTimeline(timeline, child, position, skipChecks) {
	child.parent && _removeFromParent(child);
	child._start = _roundPrecise((_isNumber(position) ? position : position || timeline !== _globalTimeline ? _parsePosition(timeline, position, child) : timeline._time) + child._delay);
	child._end = _roundPrecise(child._start + (child.totalDuration() / Math.abs(child.timeScale()) || 0));
	_addLinkedListItem(timeline, child, "_first", "_last", timeline._sort ? "_start" : 0);
	_isFromOrFromStart(child) || (timeline._recent = child);
	skipChecks || _postAddChecks(timeline, child);
	timeline._ts < 0 && _alignPlayhead(timeline, timeline._tTime);
	return timeline;
};
var _scrollTrigger = function _scrollTrigger(animation, trigger) {
	return (_globals.ScrollTrigger || _missingPlugin("scrollTrigger", trigger)) && _globals.ScrollTrigger.create(trigger, animation);
};
var _attemptInitTween = function _attemptInitTween(tween, time, force, suppressEvents, tTime) {
	_initTween(tween, time, tTime);
	if (!tween._initted) return 1;
	if (!force && tween._pt && !_reverting$1 && (tween._dur && tween.vars.lazy !== false || !tween._dur && tween.vars.lazy) && _lastRenderedFrame !== _ticker.frame) {
		_lazyTweens.push(tween);
		tween._lazy = [tTime, suppressEvents];
		return 1;
	}
};
var _parentPlayheadIsBeforeStart = function _parentPlayheadIsBeforeStart(_ref) {
	var parent = _ref.parent;
	return parent && parent._ts && parent._initted && !parent._lock && (parent.rawTime() < 0 || _parentPlayheadIsBeforeStart(parent));
};
var _isFromOrFromStart = function _isFromOrFromStart(_ref2) {
	var data = _ref2.data;
	return data === "isFromStart" || data === "isStart";
};
var _renderZeroDurationTween = function _renderZeroDurationTween(tween, totalTime, suppressEvents, force) {
	var prevRatio = tween.ratio, ratio = totalTime < 0 || !totalTime && (!tween._start && _parentPlayheadIsBeforeStart(tween) && !(!tween._initted && _isFromOrFromStart(tween)) || (tween._ts < 0 || tween._dp._ts < 0) && !_isFromOrFromStart(tween)) ? 0 : 1, repeatDelay = tween._rDelay, tTime = 0, pt, iteration, prevIteration;
	if (repeatDelay && tween._repeat) {
		tTime = _clamp(0, tween._tDur, totalTime);
		iteration = _animationCycle(tTime, repeatDelay);
		tween._yoyo && iteration & 1 && (ratio = 1 - ratio);
		if (iteration !== _animationCycle(tween._tTime, repeatDelay)) {
			prevRatio = 1 - ratio;
			tween.vars.repeatRefresh && tween._initted && tween.invalidate();
		}
	}
	if (ratio !== prevRatio || _reverting$1 || force || tween._zTime === _tinyNum || !totalTime && tween._zTime) {
		if (!tween._initted && _attemptInitTween(tween, totalTime, force, suppressEvents, tTime)) return;
		prevIteration = tween._zTime;
		tween._zTime = totalTime || (suppressEvents ? _tinyNum : 0);
		suppressEvents || (suppressEvents = totalTime && !prevIteration);
		tween.ratio = ratio;
		tween._from && (ratio = 1 - ratio);
		tween._time = 0;
		tween._tTime = tTime;
		pt = tween._pt;
		while (pt) {
			pt.r(ratio, pt.d);
			pt = pt._next;
		}
		totalTime < 0 && _rewindStartAt(tween, totalTime, suppressEvents, true);
		tween._onUpdate && !suppressEvents && _callback(tween, "onUpdate");
		tTime && tween._repeat && !suppressEvents && tween.parent && _callback(tween, "onRepeat");
		if ((totalTime >= tween._tDur || totalTime < 0) && tween.ratio === ratio) {
			ratio && _removeFromParent(tween, 1);
			if (!suppressEvents && !_reverting$1) {
				_callback(tween, ratio ? "onComplete" : "onReverseComplete", true);
				tween._prom && tween._prom();
			}
		}
	} else if (!tween._zTime) tween._zTime = totalTime;
};
var _findNextPauseTween = function _findNextPauseTween(animation, prevTime, time) {
	var child;
	if (time > prevTime) {
		child = animation._first;
		while (child && child._start <= time) {
			if (child.data === "isPause" && child._start > prevTime) return child;
			child = child._next;
		}
	} else {
		child = animation._last;
		while (child && child._start >= time) {
			if (child.data === "isPause" && child._start < prevTime) return child;
			child = child._prev;
		}
	}
};
var _setDuration = function _setDuration(animation, duration, skipUncache, leavePlayhead) {
	var repeat = animation._repeat, dur = _roundPrecise(duration) || 0, totalProgress = animation._tTime / animation._tDur;
	totalProgress && !leavePlayhead && (animation._time *= dur / animation._dur);
	animation._dur = dur;
	animation._tDur = !repeat ? dur : repeat < 0 ? 1e10 : _roundPrecise(dur * (repeat + 1) + animation._rDelay * repeat);
	totalProgress > 0 && !leavePlayhead && _alignPlayhead(animation, animation._tTime = animation._tDur * totalProgress);
	animation.parent && _setEnd(animation);
	skipUncache || _uncache(animation.parent, animation);
	return animation;
};
var _onUpdateTotalDuration = function _onUpdateTotalDuration(animation) {
	return animation instanceof Timeline ? _uncache(animation) : _setDuration(animation, animation._dur);
};
var _zeroPosition = {
	_start: 0,
	endTime: _emptyFunc,
	totalDuration: _emptyFunc
};
var _parsePosition = function _parsePosition(animation, position, percentAnimation) {
	var labels = animation.labels, recent = animation._recent || _zeroPosition, clippedDuration = animation.duration() >= _bigNum$1 ? recent.endTime(false) : animation._dur, i, offset, isPercent;
	if (_isString(position) && (isNaN(position) || position in labels)) {
		offset = position.charAt(0);
		isPercent = position.substr(-1) === "%";
		i = position.indexOf("=");
		if (offset === "<" || offset === ">") {
			i >= 0 && (position = position.replace(/=/, ""));
			return (offset === "<" ? recent._start : recent.endTime(recent._repeat >= 0)) + (parseFloat(position.substr(1)) || 0) * (isPercent ? (i < 0 ? recent : percentAnimation).totalDuration() / 100 : 1);
		}
		if (i < 0) {
			position in labels || (labels[position] = clippedDuration);
			return labels[position];
		}
		offset = parseFloat(position.charAt(i - 1) + position.substr(i + 1));
		if (isPercent && percentAnimation) offset = offset / 100 * (_isArray(percentAnimation) ? percentAnimation[0] : percentAnimation).totalDuration();
		return i > 1 ? _parsePosition(animation, position.substr(0, i - 1), percentAnimation) + offset : clippedDuration + offset;
	}
	return position == null ? clippedDuration : +position;
};
var _createTweenType = function _createTweenType(type, params, timeline) {
	var isLegacy = _isNumber(params[1]), varsIndex = (isLegacy ? 2 : 1) + (type < 2 ? 0 : 1), vars = params[varsIndex], irVars, parent;
	isLegacy && (vars.duration = params[1]);
	vars.parent = timeline;
	if (type) {
		irVars = vars;
		parent = timeline;
		while (parent && !("immediateRender" in irVars)) {
			irVars = parent.vars.defaults || {};
			parent = _isNotFalse(parent.vars.inherit) && parent.parent;
		}
		vars.immediateRender = _isNotFalse(irVars.immediateRender);
		type < 2 ? vars.runBackwards = 1 : vars.startAt = params[varsIndex - 1];
	}
	return new Tween(params[0], vars, params[varsIndex + 1]);
};
var _conditionalReturn = function _conditionalReturn(value, func) {
	return value || value === 0 ? func(value) : func;
};
var _clamp = function _clamp(min, max, value) {
	return value < min ? min : value > max ? max : value;
};
var getUnit = function getUnit(value, v) {
	return !_isString(value) || !(v = _unitExp.exec(value)) ? "" : v[1];
};
var clamp = function clamp(min, max, value) {
	return _conditionalReturn(value, function(v) {
		return _clamp(min, max, v);
	});
};
var _slice = [].slice;
var _isArrayLike = function _isArrayLike(value, nonEmpty) {
	return value && _isObject(value) && "length" in value && (!nonEmpty && !value.length || value.length - 1 in value && _isObject(value[0])) && !value.nodeType && value !== _win$1;
};
var _flatten = function _flatten(ar, leaveStrings, accumulator) {
	if (accumulator === void 0) accumulator = [];
	return ar.forEach(function(value) {
		var _accumulator;
		return _isString(value) && !leaveStrings || _isArrayLike(value, 1) ? (_accumulator = accumulator).push.apply(_accumulator, toArray(value)) : accumulator.push(value);
	}) || accumulator;
};
var toArray = function toArray(value, scope, leaveStrings) {
	return _context && !scope && _context.selector ? _context.selector(value) : _isString(value) && !leaveStrings && (_coreInitted || !_wake()) ? _slice.call((scope || _doc$1).querySelectorAll(value), 0) : _isArray(value) ? _flatten(value, leaveStrings) : _isArrayLike(value) ? _slice.call(value, 0) : value ? [value] : [];
};
var selector = function selector(value) {
	value = toArray(value)[0] || _warn("Invalid scope") || {};
	return function(v) {
		var el = value.current || value.nativeElement || value;
		return toArray(v, el.querySelectorAll ? el : el === value ? _warn("Invalid scope") || _doc$1.createElement("div") : value);
	};
};
var shuffle = function shuffle(a) {
	return a.sort(function() {
		return .5 - Math.random();
	});
};
var distribute = function distribute(v) {
	if (_isFunction(v)) return v;
	var vars = _isObject(v) ? v : { each: v }, ease = _parseEase(vars.ease), from = vars.from || 0, base = parseFloat(vars.base) || 0, cache = {}, isDecimal = from > 0 && from < 1, ratios = isNaN(from) || isDecimal, axis = vars.axis, ratioX = from, ratioY = from;
	if (_isString(from)) ratioX = ratioY = {
		center: .5,
		edges: .5,
		end: 1
	}[from] || 0;
	else if (!isDecimal && ratios) {
		ratioX = from[0];
		ratioY = from[1];
	}
	return function(i, target, a) {
		var l = (a || vars).length, distances = cache[l], originX, originY, x, y, d, j, max, min, wrapAt;
		if (!distances) {
			wrapAt = vars.grid === "auto" ? 0 : (vars.grid || [1, _bigNum$1])[1];
			if (!wrapAt) {
				max = -_bigNum$1;
				while (max < (max = a[wrapAt++].getBoundingClientRect().left) && wrapAt < l);
				wrapAt < l && wrapAt--;
			}
			distances = cache[l] = [];
			originX = ratios ? Math.min(wrapAt, l) * ratioX - .5 : from % wrapAt;
			originY = wrapAt === _bigNum$1 ? 0 : ratios ? l * ratioY / wrapAt - .5 : from / wrapAt | 0;
			max = 0;
			min = _bigNum$1;
			for (j = 0; j < l; j++) {
				x = j % wrapAt - originX;
				y = originY - (j / wrapAt | 0);
				distances[j] = d = !axis ? _sqrt(x * x + y * y) : Math.abs(axis === "y" ? y : x);
				d > max && (max = d);
				d < min && (min = d);
			}
			from === "random" && shuffle(distances);
			distances.max = max - min;
			distances.min = min;
			distances.v = l = (parseFloat(vars.amount) || parseFloat(vars.each) * (wrapAt > l ? l - 1 : !axis ? Math.max(wrapAt, l / wrapAt) : axis === "y" ? l / wrapAt : wrapAt) || 0) * (from === "edges" ? -1 : 1);
			distances.b = l < 0 ? base - l : base;
			distances.u = getUnit(vars.amount || vars.each) || 0;
			ease = ease && l < 0 ? _invertEase(ease) : ease;
		}
		l = (distances[i] - distances.min) / distances.max || 0;
		return _roundPrecise(distances.b + (ease ? ease(l) : l) * distances.v) + distances.u;
	};
};
var _roundModifier = function _roundModifier(v) {
	var p = Math.pow(10, ((v + "").split(".")[1] || "").length);
	return function(raw) {
		var n = _roundPrecise(Math.round(parseFloat(raw) / v) * v * p);
		return (n - n % 1) / p + (_isNumber(raw) ? 0 : getUnit(raw));
	};
};
var snap = function snap(snapTo, value) {
	var isArray = _isArray(snapTo), radius, is2D;
	if (!isArray && _isObject(snapTo)) {
		radius = isArray = snapTo.radius || _bigNum$1;
		if (snapTo.values) {
			snapTo = toArray(snapTo.values);
			if (is2D = !_isNumber(snapTo[0])) radius *= radius;
		} else snapTo = _roundModifier(snapTo.increment);
	}
	return _conditionalReturn(value, !isArray ? _roundModifier(snapTo) : _isFunction(snapTo) ? function(raw) {
		is2D = snapTo(raw);
		return Math.abs(is2D - raw) <= radius ? is2D : raw;
	} : function(raw) {
		var x = parseFloat(is2D ? raw.x : raw), y = parseFloat(is2D ? raw.y : 0), min = _bigNum$1, closest = 0, i = snapTo.length, dx, dy;
		while (i--) {
			if (is2D) {
				dx = snapTo[i].x - x;
				dy = snapTo[i].y - y;
				dx = dx * dx + dy * dy;
			} else dx = Math.abs(snapTo[i] - x);
			if (dx < min) {
				min = dx;
				closest = i;
			}
		}
		closest = !radius || min <= radius ? snapTo[closest] : raw;
		return is2D || closest === raw || _isNumber(raw) ? closest : closest + getUnit(raw);
	});
};
var random = function random(min, max, roundingIncrement, returnFunction) {
	return _conditionalReturn(_isArray(min) ? !max : roundingIncrement === true ? !!(roundingIncrement = 0) : !returnFunction, function() {
		return _isArray(min) ? min[~~(Math.random() * min.length)] : (roundingIncrement = roundingIncrement || 1e-5) && (returnFunction = roundingIncrement < 1 ? Math.pow(10, (roundingIncrement + "").length - 2) : 1) && Math.floor(Math.round((min - roundingIncrement / 2 + Math.random() * (max - min + roundingIncrement * .99)) / roundingIncrement) * roundingIncrement * returnFunction) / returnFunction;
	});
};
var pipe = function pipe() {
	for (var _len = arguments.length, functions = new Array(_len), _key = 0; _key < _len; _key++) functions[_key] = arguments[_key];
	return function(value) {
		return functions.reduce(function(v, f) {
			return f(v);
		}, value);
	};
};
var unitize = function unitize(func, unit) {
	return function(value) {
		return func(parseFloat(value)) + (unit || getUnit(value));
	};
};
var normalize = function normalize(min, max, value) {
	return mapRange(min, max, 0, 1, value);
};
var _wrapArray = function _wrapArray(a, wrapper, value) {
	return _conditionalReturn(value, function(index) {
		return a[~~wrapper(index)];
	});
};
var wrap = function wrap(min, max, value) {
	var range = max - min;
	return _isArray(min) ? _wrapArray(min, wrap(0, min.length), max) : _conditionalReturn(value, function(value) {
		return (range + (value - min) % range) % range + min;
	});
};
var wrapYoyo = function wrapYoyo(min, max, value) {
	var range = max - min, total = range * 2;
	return _isArray(min) ? _wrapArray(min, wrapYoyo(0, min.length - 1), max) : _conditionalReturn(value, function(value) {
		value = (total + (value - min) % total) % total || 0;
		return min + (value > range ? total - value : value);
	});
};
var _replaceRandom = function _replaceRandom(s) {
	return s.replace(_randomExp, function(match) {
		var arIndex = match.indexOf("[") + 1, values = match.substring(arIndex || 7, arIndex ? match.indexOf("]") : match.length - 1).split(_commaDelimExp);
		return random(arIndex ? values : +values[0], arIndex ? 0 : +values[1], +values[2] || 1e-5);
	});
};
var mapRange = function mapRange(inMin, inMax, outMin, outMax, value) {
	var inRange = inMax - inMin, outRange = outMax - outMin;
	return _conditionalReturn(value, function(value) {
		return outMin + ((value - inMin) / inRange * outRange || 0);
	});
};
var interpolate = function interpolate(start, end, progress, mutate) {
	var func = isNaN(start + end) ? 0 : function(p) {
		return (1 - p) * start + p * end;
	};
	if (!func) {
		var isString = _isString(start), master = {}, p, i, interpolators, l, il;
		progress === true && (mutate = 1) && (progress = null);
		if (isString) {
			start = { p: start };
			end = { p: end };
		} else if (_isArray(start) && !_isArray(end)) {
			interpolators = [];
			l = start.length;
			il = l - 2;
			for (i = 1; i < l; i++) interpolators.push(interpolate(start[i - 1], start[i]));
			l--;
			func = function func(p) {
				p *= l;
				var i = Math.min(il, ~~p);
				return interpolators[i](p - i);
			};
			progress = end;
		} else if (!mutate) start = _merge(_isArray(start) ? [] : {}, start);
		if (!interpolators) {
			for (p in end) _addPropTween.call(master, start, p, "get", end[p]);
			func = function func(p) {
				return _renderPropTweens(p, master) || (isString ? start.p : start);
			};
		}
	}
	return _conditionalReturn(progress, func);
};
var _getLabelInDirection = function _getLabelInDirection(timeline, fromTime, backward) {
	var labels = timeline.labels, min = _bigNum$1, p, distance, label;
	for (p in labels) {
		distance = labels[p] - fromTime;
		if (distance < 0 === !!backward && distance && min > (distance = Math.abs(distance))) {
			label = p;
			min = distance;
		}
	}
	return label;
};
var _callback = function _callback(animation, type, executeLazyFirst) {
	var v = animation.vars, callback = v[type], prevContext = _context, context = animation._ctx, params, scope, result;
	if (!callback) return;
	params = v[type + "Params"];
	scope = v.callbackScope || animation;
	executeLazyFirst && _lazyTweens.length && _lazyRender();
	context && (_context = context);
	result = params ? callback.apply(scope, params) : callback.call(scope);
	_context = prevContext;
	return result;
};
var _interrupt = function _interrupt(animation) {
	_removeFromParent(animation);
	animation.scrollTrigger && animation.scrollTrigger.kill(!!_reverting$1);
	animation.progress() < 1 && _callback(animation, "onInterrupt");
	return animation;
};
var _quickTween;
var _registerPluginQueue = [];
var _createPlugin = function _createPlugin(config) {
	if (!config) return;
	config = !config.name && config["default"] || config;
	if (_windowExists$1() || config.headless) {
		var name = config.name, isFunc = _isFunction(config), Plugin = name && !isFunc && config.init ? function() {
			this._props = [];
		} : config, instanceDefaults = {
			init: _emptyFunc,
			render: _renderPropTweens,
			add: _addPropTween,
			kill: _killPropTweensOf,
			modifier: _addPluginModifier,
			rawVars: 0
		}, statics = {
			targetTest: 0,
			get: 0,
			getSetter: _getSetter,
			aliases: {},
			register: 0
		};
		_wake();
		if (config !== Plugin) {
			if (_plugins[name]) return;
			_setDefaults(Plugin, _setDefaults(_copyExcluding(config, instanceDefaults), statics));
			_merge(Plugin.prototype, _merge(instanceDefaults, _copyExcluding(config, statics)));
			_plugins[Plugin.prop = name] = Plugin;
			if (config.targetTest) {
				_harnessPlugins.push(Plugin);
				_reservedProps[name] = 1;
			}
			name = (name === "css" ? "CSS" : name.charAt(0).toUpperCase() + name.substr(1)) + "Plugin";
		}
		_addGlobal(name, Plugin);
		config.register && config.register(gsap, Plugin, PropTween);
	} else _registerPluginQueue.push(config);
};
var _255 = 255;
var _colorLookup = {
	aqua: [
		0,
		_255,
		_255
	],
	lime: [
		0,
		_255,
		0
	],
	silver: [
		192,
		192,
		192
	],
	black: [
		0,
		0,
		0
	],
	maroon: [
		128,
		0,
		0
	],
	teal: [
		0,
		128,
		128
	],
	blue: [
		0,
		0,
		_255
	],
	navy: [
		0,
		0,
		128
	],
	white: [
		_255,
		_255,
		_255
	],
	olive: [
		128,
		128,
		0
	],
	yellow: [
		_255,
		_255,
		0
	],
	orange: [
		_255,
		165,
		0
	],
	gray: [
		128,
		128,
		128
	],
	purple: [
		128,
		0,
		128
	],
	green: [
		0,
		128,
		0
	],
	red: [
		_255,
		0,
		0
	],
	pink: [
		_255,
		192,
		203
	],
	cyan: [
		0,
		_255,
		_255
	],
	transparent: [
		_255,
		_255,
		_255,
		0
	]
};
var _hue = function _hue(h, m1, m2) {
	h += h < 0 ? 1 : h > 1 ? -1 : 0;
	return (h * 6 < 1 ? m1 + (m2 - m1) * h * 6 : h < .5 ? m2 : h * 3 < 2 ? m1 + (m2 - m1) * (2 / 3 - h) * 6 : m1) * _255 + .5 | 0;
};
var splitColor = function splitColor(v, toHSL, forceAlpha) {
	var a = !v ? _colorLookup.black : _isNumber(v) ? [
		v >> 16,
		v >> 8 & _255,
		v & _255
	] : 0, r, g, b, h, s, l, max, min, d, wasHSL;
	if (!a) {
		if (v.substr(-1) === ",") v = v.substr(0, v.length - 1);
		if (_colorLookup[v]) a = _colorLookup[v];
		else if (v.charAt(0) === "#") {
			if (v.length < 6) {
				r = v.charAt(1);
				g = v.charAt(2);
				b = v.charAt(3);
				v = "#" + r + r + g + g + b + b + (v.length === 5 ? v.charAt(4) + v.charAt(4) : "");
			}
			if (v.length === 9) {
				a = parseInt(v.substr(1, 6), 16);
				return [
					a >> 16,
					a >> 8 & _255,
					a & _255,
					parseInt(v.substr(7), 16) / 255
				];
			}
			v = parseInt(v.substr(1), 16);
			a = [
				v >> 16,
				v >> 8 & _255,
				v & _255
			];
		} else if (v.substr(0, 3) === "hsl") {
			a = wasHSL = v.match(_strictNumExp);
			if (!toHSL) {
				h = +a[0] % 360 / 360;
				s = +a[1] / 100;
				l = +a[2] / 100;
				g = l <= .5 ? l * (s + 1) : l + s - l * s;
				r = l * 2 - g;
				a.length > 3 && (a[3] *= 1);
				a[0] = _hue(h + 1 / 3, r, g);
				a[1] = _hue(h, r, g);
				a[2] = _hue(h - 1 / 3, r, g);
			} else if (~v.indexOf("=")) {
				a = v.match(_numExp);
				forceAlpha && a.length < 4 && (a[3] = 1);
				return a;
			}
		} else a = v.match(_strictNumExp) || _colorLookup.transparent;
		a = a.map(Number);
	}
	if (toHSL && !wasHSL) {
		r = a[0] / _255;
		g = a[1] / _255;
		b = a[2] / _255;
		max = Math.max(r, g, b);
		min = Math.min(r, g, b);
		l = (max + min) / 2;
		if (max === min) h = s = 0;
		else {
			d = max - min;
			s = l > .5 ? d / (2 - max - min) : d / (max + min);
			h = max === r ? (g - b) / d + (g < b ? 6 : 0) : max === g ? (b - r) / d + 2 : (r - g) / d + 4;
			h *= 60;
		}
		a[0] = ~~(h + .5);
		a[1] = ~~(s * 100 + .5);
		a[2] = ~~(l * 100 + .5);
	}
	forceAlpha && a.length < 4 && (a[3] = 1);
	return a;
};
var _colorOrderData = function _colorOrderData(v) {
	var values = [], c = [], i = -1;
	v.split(_colorExp).forEach(function(v) {
		var a = v.match(_numWithUnitExp) || [];
		values.push.apply(values, a);
		c.push(i += a.length + 1);
	});
	values.c = c;
	return values;
};
var _formatColors = function _formatColors(s, toHSL, orderMatchData) {
	var result = "", colors = (s + result).match(_colorExp), type = toHSL ? "hsla(" : "rgba(", i = 0, c, shell, d, l;
	if (!colors) return s;
	colors = colors.map(function(color) {
		return (color = splitColor(color, toHSL, 1)) && type + (toHSL ? color[0] + "," + color[1] + "%," + color[2] + "%," + color[3] : color.join(",")) + ")";
	});
	if (orderMatchData) {
		d = _colorOrderData(s);
		c = orderMatchData.c;
		if (c.join(result) !== d.c.join(result)) {
			shell = s.replace(_colorExp, "1").split(_numWithUnitExp);
			l = shell.length - 1;
			for (; i < l; i++) result += shell[i] + (~c.indexOf(i) ? colors.shift() || type + "0,0,0,0)" : (d.length ? d : colors.length ? colors : orderMatchData).shift());
		}
	}
	if (!shell) {
		shell = s.split(_colorExp);
		l = shell.length - 1;
		for (; i < l; i++) result += shell[i] + colors[i];
	}
	return result + shell[l];
};
var _colorExp = function() {
	var s = "(?:\\b(?:(?:rgb|rgba|hsl|hsla)\\(.+?\\))|\\B#(?:[0-9a-f]{3,4}){1,2}\\b", p;
	for (p in _colorLookup) s += "|" + p + "\\b";
	return new RegExp(s + ")", "gi");
}();
var _hslExp = /hsl[a]?\(/;
var _colorStringFilter = function _colorStringFilter(a) {
	var combined = a.join(" "), toHSL;
	_colorExp.lastIndex = 0;
	if (_colorExp.test(combined)) {
		toHSL = _hslExp.test(combined);
		a[1] = _formatColors(a[1], toHSL);
		a[0] = _formatColors(a[0], toHSL, _colorOrderData(a[1]));
		return true;
	}
};
var _tickerActive;
var _ticker = function() {
	var _getTime = Date.now, _lagThreshold = 500, _adjustedLag = 33, _startTime = _getTime(), _lastUpdate = _startTime, _gap = 1e3 / 240, _nextTime = _gap, _listeners = [], _id, _req, _raf, _self, _delta, _i, _tick = function _tick(v) {
		var elapsed = _getTime() - _lastUpdate, manual = v === true, overlap, dispatch, time, frame;
		(elapsed > _lagThreshold || elapsed < 0) && (_startTime += elapsed - _adjustedLag);
		_lastUpdate += elapsed;
		time = _lastUpdate - _startTime;
		overlap = time - _nextTime;
		if (overlap > 0 || manual) {
			frame = ++_self.frame;
			_delta = time - _self.time * 1e3;
			_self.time = time = time / 1e3;
			_nextTime += overlap + (overlap >= _gap ? 4 : _gap - overlap);
			dispatch = 1;
		}
		manual || (_id = _req(_tick));
		if (dispatch) for (_i = 0; _i < _listeners.length; _i++) _listeners[_i](time, _delta, frame, v);
	};
	_self = {
		time: 0,
		frame: 0,
		tick: function tick() {
			_tick(true);
		},
		deltaRatio: function deltaRatio(fps) {
			return _delta / (1e3 / (fps || 60));
		},
		wake: function wake() {
			if (_coreReady) {
				if (!_coreInitted && _windowExists$1()) {
					_win$1 = _coreInitted = window;
					_doc$1 = _win$1.document || {};
					_globals.gsap = gsap;
					(_win$1.gsapVersions || (_win$1.gsapVersions = [])).push(gsap.version);
					_install(_installScope || _win$1.GreenSockGlobals || !_win$1.gsap && _win$1 || {});
					_registerPluginQueue.forEach(_createPlugin);
				}
				_raf = typeof requestAnimationFrame !== "undefined" && requestAnimationFrame;
				_id && _self.sleep();
				_req = _raf || function(f) {
					return setTimeout(f, _nextTime - _self.time * 1e3 + 1 | 0);
				};
				_tickerActive = 1;
				_tick(2);
			}
		},
		sleep: function sleep() {
			(_raf ? cancelAnimationFrame : clearTimeout)(_id);
			_tickerActive = 0;
			_req = _emptyFunc;
		},
		lagSmoothing: function lagSmoothing(threshold, adjustedLag) {
			_lagThreshold = threshold || Infinity;
			_adjustedLag = Math.min(adjustedLag || 33, _lagThreshold);
		},
		fps: function fps(_fps) {
			_gap = 1e3 / (_fps || 240);
			_nextTime = _self.time * 1e3 + _gap;
		},
		add: function add(callback, once, prioritize) {
			var func = once ? function(t, d, f, v) {
				callback(t, d, f, v);
				_self.remove(func);
			} : callback;
			_self.remove(callback);
			_listeners[prioritize ? "unshift" : "push"](func);
			_wake();
			return func;
		},
		remove: function remove(callback, i) {
			~(i = _listeners.indexOf(callback)) && _listeners.splice(i, 1) && _i >= i && _i--;
		},
		_listeners
	};
	return _self;
}();
var _wake = function _wake() {
	return !_tickerActive && _ticker.wake();
};
var _easeMap = {};
var _customEaseExp = /^[\d.\-M][\d.\-,\s]/;
var _quotesExp = /["']/g;
var _parseObjectInString = function _parseObjectInString(value) {
	var obj = {}, split = value.substr(1, value.length - 3).split(":"), key = split[0], i = 1, l = split.length, index, val, parsedVal;
	for (; i < l; i++) {
		val = split[i];
		index = i !== l - 1 ? val.lastIndexOf(",") : val.length;
		parsedVal = val.substr(0, index);
		obj[key] = isNaN(parsedVal) ? parsedVal.replace(_quotesExp, "").trim() : +parsedVal;
		key = val.substr(index + 1).trim();
	}
	return obj;
};
var _valueInParentheses = function _valueInParentheses(value) {
	var open = value.indexOf("(") + 1, close = value.indexOf(")"), nested = value.indexOf("(", open);
	return value.substring(open, ~nested && nested < close ? value.indexOf(")", close + 1) : close);
};
var _configEaseFromString = function _configEaseFromString(name) {
	var split = (name + "").split("("), ease = _easeMap[split[0]];
	return ease && split.length > 1 && ease.config ? ease.config.apply(null, ~name.indexOf("{") ? [_parseObjectInString(split[1])] : _valueInParentheses(name).split(",").map(_numericIfPossible)) : _easeMap._CE && _customEaseExp.test(name) ? _easeMap._CE("", name) : ease;
};
var _invertEase = function _invertEase(ease) {
	return function(p) {
		return 1 - ease(1 - p);
	};
};
var _parseEase = function _parseEase(ease, defaultEase) {
	return !ease ? defaultEase : (_isFunction(ease) ? ease : _easeMap[ease] || _configEaseFromString(ease)) || defaultEase;
};
var _insertEase = function _insertEase(names, easeIn, easeOut, easeInOut) {
	if (easeOut === void 0) easeOut = function easeOut(p) {
		return 1 - easeIn(1 - p);
	};
	if (easeInOut === void 0) easeInOut = function easeInOut(p) {
		return p < .5 ? easeIn(p * 2) / 2 : 1 - easeIn((1 - p) * 2) / 2;
	};
	var ease = {
		easeIn,
		easeOut,
		easeInOut
	}, lowercaseName;
	_forEachName(names, function(name) {
		_easeMap[name] = _globals[name] = ease;
		_easeMap[lowercaseName = name.toLowerCase()] = easeOut;
		for (var p in ease) _easeMap[lowercaseName + (p === "easeIn" ? ".in" : p === "easeOut" ? ".out" : ".inOut")] = _easeMap[name + "." + p] = ease[p];
	});
	return ease;
};
var _easeInOutFromOut = function _easeInOutFromOut(easeOut) {
	return function(p) {
		return p < .5 ? (1 - easeOut(1 - p * 2)) / 2 : .5 + easeOut((p - .5) * 2) / 2;
	};
};
var _configElastic = function _configElastic(type, amplitude, period) {
	var p1 = amplitude >= 1 ? amplitude : 1, p2 = (period || (type ? .3 : .45)) / (amplitude < 1 ? amplitude : 1), p3 = p2 / _2PI * (Math.asin(1 / p1) || 0), easeOut = function easeOut(p) {
		return p === 1 ? 1 : p1 * Math.pow(2, -10 * p) * _sin((p - p3) * p2) + 1;
	}, ease = type === "out" ? easeOut : type === "in" ? function(p) {
		return 1 - easeOut(1 - p);
	} : _easeInOutFromOut(easeOut);
	p2 = _2PI / p2;
	ease.config = function(amplitude, period) {
		return _configElastic(type, amplitude, period);
	};
	return ease;
};
var _configBack = function _configBack(type, overshoot) {
	if (overshoot === void 0) overshoot = 1.70158;
	var easeOut = function easeOut(p) {
		return p ? --p * p * ((overshoot + 1) * p + overshoot) + 1 : 0;
	}, ease = type === "out" ? easeOut : type === "in" ? function(p) {
		return 1 - easeOut(1 - p);
	} : _easeInOutFromOut(easeOut);
	ease.config = function(overshoot) {
		return _configBack(type, overshoot);
	};
	return ease;
};
_forEachName("Linear,Quad,Cubic,Quart,Quint,Strong", function(name, i) {
	var power = i < 5 ? i + 1 : i;
	_insertEase(name + ",Power" + (power - 1), i ? function(p) {
		return Math.pow(p, power);
	} : function(p) {
		return p;
	}, function(p) {
		return 1 - Math.pow(1 - p, power);
	}, function(p) {
		return p < .5 ? Math.pow(p * 2, power) / 2 : 1 - Math.pow((1 - p) * 2, power) / 2;
	});
});
_easeMap.Linear.easeNone = _easeMap.none = _easeMap.Linear.easeIn;
_insertEase("Elastic", _configElastic("in"), _configElastic("out"), _configElastic());
(function(n, c) {
	var n1 = 1 / c, n2 = 2 * n1, n3 = 2.5 * n1, easeOut = function easeOut(p) {
		return p < n1 ? n * p * p : p < n2 ? n * Math.pow(p - 1.5 / c, 2) + .75 : p < n3 ? n * (p -= 2.25 / c) * p + .9375 : n * Math.pow(p - 2.625 / c, 2) + .984375;
	};
	_insertEase("Bounce", function(p) {
		return 1 - easeOut(1 - p);
	}, easeOut);
})(7.5625, 2.75);
_insertEase("Expo", function(p) {
	return Math.pow(2, 10 * (p - 1)) * p + p * p * p * p * p * p * (1 - p);
});
_insertEase("Circ", function(p) {
	return -(_sqrt(1 - p * p) - 1);
});
_insertEase("Sine", function(p) {
	return p === 1 ? 1 : -_cos(p * _HALF_PI) + 1;
});
_insertEase("Back", _configBack("in"), _configBack("out"), _configBack());
_easeMap.SteppedEase = _easeMap.steps = _globals.SteppedEase = { config: function config(steps, immediateStart) {
	if (steps === void 0) steps = 1;
	var p1 = 1 / steps, p2 = steps + (immediateStart ? 0 : 1), p3 = immediateStart ? 1 : 0, max = 1 - _tinyNum;
	return function(p) {
		return ((p2 * _clamp(0, max, p) | 0) + p3) * p1;
	};
} };
_defaults.ease = _easeMap["quad.out"];
_forEachName("onComplete,onUpdate,onStart,onRepeat,onReverseComplete,onInterrupt", function(name) {
	return _callbackNames += name + "," + name + "Params,";
});
var GSCache = function GSCache(target, harness) {
	this.id = _gsID++;
	target._gsap = this;
	this.target = target;
	this.harness = harness;
	this.get = harness ? harness.get : _getProperty;
	this.set = harness ? harness.getSetter : _getSetter;
};
var Animation = /*#__PURE__*/ function() {
	function Animation(vars) {
		this.vars = vars;
		this._delay = +vars.delay || 0;
		if (this._repeat = vars.repeat === Infinity ? -2 : vars.repeat || 0) {
			this._rDelay = vars.repeatDelay || 0;
			this._yoyo = !!vars.yoyo || !!vars.yoyoEase;
		}
		this._ts = 1;
		_setDuration(this, +vars.duration, 1, 1);
		this.data = vars.data;
		if (_context) {
			this._ctx = _context;
			_context.data.push(this);
		}
		_tickerActive || _ticker.wake();
	}
	var _proto = Animation.prototype;
	_proto.delay = function delay(value) {
		if (value || value === 0) {
			this.parent && this.parent.smoothChildTiming && this.startTime(this._start + value - this._delay);
			this._delay = value;
			return this;
		}
		return this._delay;
	};
	_proto.duration = function duration(value) {
		return arguments.length ? this.totalDuration(this._repeat > 0 ? value + (value + this._rDelay) * this._repeat : value) : this.totalDuration() && this._dur;
	};
	_proto.totalDuration = function totalDuration(value) {
		if (!arguments.length) return this._tDur;
		this._dirty = 0;
		return _setDuration(this, this._repeat < 0 ? value : (value - this._repeat * this._rDelay) / (this._repeat + 1));
	};
	_proto.totalTime = function totalTime(_totalTime, suppressEvents) {
		_wake();
		if (!arguments.length) return this._tTime;
		var parent = this._dp;
		if (parent && parent.smoothChildTiming && this._ts) {
			_alignPlayhead(this, _totalTime);
			!parent._dp || parent.parent || _postAddChecks(parent, this);
			while (parent && parent.parent) {
				if (parent.parent._time !== parent._start + (parent._ts >= 0 ? parent._tTime / parent._ts : (parent.totalDuration() - parent._tTime) / -parent._ts)) parent.totalTime(parent._tTime, true);
				parent = parent.parent;
			}
			if (!this.parent && this._dp.autoRemoveChildren && (this._ts > 0 && _totalTime < this._tDur || this._ts < 0 && _totalTime > 0 || !this._tDur && !_totalTime)) _addToTimeline(this._dp, this, this._start - this._delay);
		}
		if (this._tTime !== _totalTime || !this._dur && !suppressEvents || this._initted && Math.abs(this._zTime) === _tinyNum || !this._initted && this._dur && _totalTime || !_totalTime && !this._initted && (this.add || this._ptLookup)) {
			this._ts || (this._pTime = _totalTime);
			_lazySafeRender(this, _totalTime, suppressEvents);
		}
		return this;
	};
	_proto.time = function time(value, suppressEvents) {
		return arguments.length ? this.totalTime(Math.min(this.totalDuration(), value + _elapsedCycleDuration(this)) % (this._dur + this._rDelay) || (value ? this._dur : 0), suppressEvents) : this._time;
	};
	_proto.totalProgress = function totalProgress(value, suppressEvents) {
		return arguments.length ? this.totalTime(this.totalDuration() * value, suppressEvents) : this.totalDuration() ? Math.min(1, this._tTime / this._tDur) : this.rawTime() >= 0 && this._initted ? 1 : 0;
	};
	_proto.progress = function progress(value, suppressEvents) {
		return arguments.length ? this.totalTime(this.duration() * (this._yoyo && !(this.iteration() & 1) ? 1 - value : value) + _elapsedCycleDuration(this), suppressEvents) : this.duration() ? Math.min(1, this._time / this._dur) : this.rawTime() > 0 ? 1 : 0;
	};
	_proto.iteration = function iteration(value, suppressEvents) {
		var cycleDuration = this.duration() + this._rDelay;
		return arguments.length ? this.totalTime(this._time + (value - 1) * cycleDuration, suppressEvents) : this._repeat ? _animationCycle(this._tTime, cycleDuration) + 1 : 1;
	};
	_proto.timeScale = function timeScale(value, suppressEvents) {
		if (!arguments.length) return this._rts === -_tinyNum ? 0 : this._rts;
		if (this._rts === value) return this;
		var tTime = this.parent && this._ts ? _parentToChildTotalTime(this.parent._time, this) : this._tTime;
		this._rts = +value || 0;
		this._ts = this._ps || value === -_tinyNum ? 0 : this._rts;
		this.totalTime(_clamp(-Math.abs(this._delay), this.totalDuration(), tTime), suppressEvents !== false);
		_setEnd(this);
		return _recacheAncestors(this);
	};
	_proto.paused = function paused(value) {
		if (!arguments.length) return this._ps;
		if (this._ps !== value) {
			this._ps = value;
			if (value) {
				this._pTime = this._tTime || Math.max(-this._delay, this.rawTime());
				this._ts = this._act = 0;
			} else {
				_wake();
				this._ts = this._rts;
				this.totalTime(this.parent && !this.parent.smoothChildTiming ? this.rawTime() : this._tTime || this._pTime, this.progress() === 1 && Math.abs(this._zTime) !== _tinyNum && (this._tTime -= _tinyNum));
			}
		}
		return this;
	};
	_proto.startTime = function startTime(value) {
		if (arguments.length) {
			this._start = _roundPrecise(value);
			var parent = this.parent || this._dp;
			parent && (parent._sort || !this.parent) && _addToTimeline(parent, this, this._start - this._delay);
			return this;
		}
		return this._start;
	};
	_proto.endTime = function endTime(includeRepeats) {
		return this._start + (_isNotFalse(includeRepeats) ? this.totalDuration() : this.duration()) / Math.abs(this._ts || 1);
	};
	_proto.rawTime = function rawTime(wrapRepeats) {
		var parent = this.parent || this._dp;
		return !parent ? this._tTime : wrapRepeats && (!this._ts || this._repeat && this._time && this.totalProgress() < 1) ? this._tTime % (this._dur + this._rDelay) : !this._ts ? this._tTime : _parentToChildTotalTime(parent.rawTime(wrapRepeats), this);
	};
	_proto.revert = function revert(config) {
		if (config === void 0) config = _revertConfig;
		var prevIsReverting = _reverting$1;
		_reverting$1 = config;
		if (_isRevertWorthy(this)) {
			this.timeline && this.timeline.revert(config);
			this.totalTime(-.01, config.suppressEvents);
		}
		this.data !== "nested" && config.kill !== false && this.kill();
		_reverting$1 = prevIsReverting;
		return this;
	};
	_proto.globalTime = function globalTime(rawTime) {
		var animation = this, time = arguments.length ? rawTime : animation.rawTime();
		while (animation) {
			time = animation._start + time / (Math.abs(animation._ts) || 1);
			animation = animation._dp;
		}
		return !this.parent && this._sat ? this._sat.globalTime(rawTime) : time;
	};
	_proto.repeat = function repeat(value) {
		if (arguments.length) {
			this._repeat = value === Infinity ? -2 : value;
			return _onUpdateTotalDuration(this);
		}
		return this._repeat === -2 ? Infinity : this._repeat;
	};
	_proto.repeatDelay = function repeatDelay(value) {
		if (arguments.length) {
			var time = this._time;
			this._rDelay = value;
			_onUpdateTotalDuration(this);
			return time ? this.time(time) : this;
		}
		return this._rDelay;
	};
	_proto.yoyo = function yoyo(value) {
		if (arguments.length) {
			this._yoyo = value;
			return this;
		}
		return this._yoyo;
	};
	_proto.seek = function seek(position, suppressEvents) {
		return this.totalTime(_parsePosition(this, position), _isNotFalse(suppressEvents));
	};
	_proto.restart = function restart(includeDelay, suppressEvents) {
		this.play().totalTime(includeDelay ? -this._delay : 0, _isNotFalse(suppressEvents));
		this._dur || (this._zTime = -_tinyNum);
		return this;
	};
	_proto.play = function play(from, suppressEvents) {
		from != null && this.seek(from, suppressEvents);
		return this.reversed(false).paused(false);
	};
	_proto.reverse = function reverse(from, suppressEvents) {
		from != null && this.seek(from || this.totalDuration(), suppressEvents);
		return this.reversed(true).paused(false);
	};
	_proto.pause = function pause(atTime, suppressEvents) {
		atTime != null && this.seek(atTime, suppressEvents);
		return this.paused(true);
	};
	_proto.resume = function resume() {
		return this.paused(false);
	};
	_proto.reversed = function reversed(value) {
		if (arguments.length) {
			!!value !== this.reversed() && this.timeScale(-this._rts || (value ? -_tinyNum : 0));
			return this;
		}
		return this._rts < 0;
	};
	_proto.invalidate = function invalidate() {
		this._initted = this._act = 0;
		this._zTime = -_tinyNum;
		return this;
	};
	_proto.isActive = function isActive() {
		var parent = this.parent || this._dp, start = this._start, rawTime;
		return !!(!parent || this._ts && this._initted && parent.isActive() && (rawTime = parent.rawTime(true)) >= start && rawTime < this.endTime(true) - _tinyNum);
	};
	_proto.eventCallback = function eventCallback(type, callback, params) {
		var vars = this.vars;
		if (arguments.length > 1) {
			if (!callback) delete vars[type];
			else {
				vars[type] = callback;
				params && (vars[type + "Params"] = params);
				type === "onUpdate" && (this._onUpdate = callback);
			}
			return this;
		}
		return vars[type];
	};
	_proto.then = function then(onFulfilled) {
		var self = this, prevProm = self._prom;
		return new Promise(function(resolve) {
			var f = _isFunction(onFulfilled) ? onFulfilled : _passThrough, _resolve = function _resolve() {
				var _then = self.then;
				self.then = null;
				prevProm && prevProm();
				_isFunction(f) && (f = f(self)) && (f.then || f === self) && (self.then = _then);
				resolve(f);
				self.then = _then;
			};
			if (self._initted && self.totalProgress() === 1 && self._ts >= 0 || !self._tTime && self._ts < 0) _resolve();
			else self._prom = _resolve;
		});
	};
	_proto.kill = function kill() {
		_interrupt(this);
	};
	return Animation;
}();
_setDefaults(Animation.prototype, {
	_time: 0,
	_start: 0,
	_end: 0,
	_tTime: 0,
	_tDur: 0,
	_dirty: 0,
	_repeat: 0,
	_yoyo: false,
	parent: null,
	_initted: false,
	_rDelay: 0,
	_ts: 1,
	_dp: 0,
	ratio: 0,
	_zTime: -_tinyNum,
	_prom: 0,
	_ps: false,
	_rts: 1
});
var Timeline = /*#__PURE__*/ function(_Animation) {
	_inheritsLoose(Timeline, _Animation);
	function Timeline(vars, position) {
		var _this;
		if (vars === void 0) vars = {};
		_this = _Animation.call(this, vars) || this;
		_this.labels = {};
		_this.smoothChildTiming = !!vars.smoothChildTiming;
		_this.autoRemoveChildren = !!vars.autoRemoveChildren;
		_this._sort = _isNotFalse(vars.sortChildren);
		_globalTimeline && _addToTimeline(vars.parent || _globalTimeline, _assertThisInitialized(_this), position);
		vars.reversed && _this.reverse();
		vars.paused && _this.paused(true);
		vars.scrollTrigger && _scrollTrigger(_assertThisInitialized(_this), vars.scrollTrigger);
		return _this;
	}
	var _proto2 = Timeline.prototype;
	_proto2.to = function to(targets, vars, position) {
		_createTweenType(0, arguments, this);
		return this;
	};
	_proto2.from = function from(targets, vars, position) {
		_createTweenType(1, arguments, this);
		return this;
	};
	_proto2.fromTo = function fromTo(targets, fromVars, toVars, position) {
		_createTweenType(2, arguments, this);
		return this;
	};
	_proto2.set = function set(targets, vars, position) {
		vars.duration = 0;
		vars.parent = this;
		_inheritDefaults(vars).repeatDelay || (vars.repeat = 0);
		vars.immediateRender = !!vars.immediateRender;
		new Tween(targets, vars, _parsePosition(this, position), 1);
		return this;
	};
	_proto2.call = function call(callback, params, position) {
		return _addToTimeline(this, Tween.delayedCall(0, callback, params), position);
	};
	_proto2.staggerTo = function staggerTo(targets, duration, vars, stagger, position, onCompleteAll, onCompleteAllParams) {
		vars.duration = duration;
		vars.stagger = vars.stagger || stagger;
		vars.onComplete = onCompleteAll;
		vars.onCompleteParams = onCompleteAllParams;
		vars.parent = this;
		new Tween(targets, vars, _parsePosition(this, position));
		return this;
	};
	_proto2.staggerFrom = function staggerFrom(targets, duration, vars, stagger, position, onCompleteAll, onCompleteAllParams) {
		vars.runBackwards = 1;
		_inheritDefaults(vars).immediateRender = _isNotFalse(vars.immediateRender);
		return this.staggerTo(targets, duration, vars, stagger, position, onCompleteAll, onCompleteAllParams);
	};
	_proto2.staggerFromTo = function staggerFromTo(targets, duration, fromVars, toVars, stagger, position, onCompleteAll, onCompleteAllParams) {
		toVars.startAt = fromVars;
		_inheritDefaults(toVars).immediateRender = _isNotFalse(toVars.immediateRender);
		return this.staggerTo(targets, duration, toVars, stagger, position, onCompleteAll, onCompleteAllParams);
	};
	_proto2.render = function render(totalTime, suppressEvents, force) {
		var prevTime = this._time, tDur = this._dirty ? this.totalDuration() : this._tDur, dur = this._dur, tTime = totalTime <= 0 ? 0 : _roundPrecise(totalTime), crossingStart = this._zTime < 0 !== totalTime < 0 && (this._initted || !dur), time, child, next, iteration, cycleDuration, prevPaused, pauseTween, timeScale, prevStart, prevIteration, yoyo, isYoyo;
		this !== _globalTimeline && tTime > tDur && totalTime >= 0 && (tTime = tDur);
		if (tTime !== this._tTime || force || crossingStart) {
			if (prevTime !== this._time && dur) {
				tTime += this._time - prevTime;
				totalTime += this._time - prevTime;
			}
			time = tTime;
			prevStart = this._start;
			timeScale = this._ts;
			prevPaused = !timeScale;
			if (crossingStart) {
				dur || (prevTime = this._zTime);
				(totalTime || !suppressEvents) && (this._zTime = totalTime);
			}
			if (this._repeat) {
				yoyo = this._yoyo;
				cycleDuration = dur + this._rDelay;
				if (this._repeat < -1 && totalTime < 0) return this.totalTime(cycleDuration * 100 + totalTime, suppressEvents, force);
				time = _roundPrecise(tTime % cycleDuration);
				if (tTime === tDur) {
					iteration = this._repeat;
					time = dur;
				} else {
					prevIteration = _roundPrecise(tTime / cycleDuration);
					iteration = ~~prevIteration;
					if (iteration && iteration === prevIteration) {
						time = dur;
						iteration--;
					}
					time > dur && (time = dur);
				}
				prevIteration = _animationCycle(this._tTime, cycleDuration);
				!prevTime && this._tTime && prevIteration !== iteration && this._tTime - prevIteration * cycleDuration - this._dur <= 0 && (prevIteration = iteration);
				if (yoyo && iteration & 1) {
					time = dur - time;
					isYoyo = 1;
				}
				if (iteration !== prevIteration && !this._lock) {
					var rewinding = yoyo && prevIteration & 1, doesWrap = rewinding === (yoyo && iteration & 1);
					iteration < prevIteration && (rewinding = !rewinding);
					prevTime = rewinding ? 0 : tTime % dur ? dur : tTime;
					this._lock = 1;
					this.render(prevTime || (isYoyo ? 0 : _roundPrecise(iteration * cycleDuration)), suppressEvents, !dur)._lock = 0;
					this._tTime = tTime;
					!suppressEvents && this.parent && _callback(this, "onRepeat");
					if (this.vars.repeatRefresh && !isYoyo) {
						this.invalidate()._lock = 1;
						prevIteration = iteration;
					}
					if (prevTime && prevTime !== this._time || prevPaused !== !this._ts || this.vars.onRepeat && !this.parent && !this._act) return this;
					dur = this._dur;
					tDur = this._tDur;
					if (doesWrap) {
						this._lock = 2;
						prevTime = rewinding ? dur : -1e-4;
						this.render(prevTime, true);
						this.vars.repeatRefresh && !isYoyo && this.invalidate();
					}
					this._lock = 0;
					if (!this._ts && !prevPaused) return this;
				}
			}
			if (this._hasPause && !this._forcing && this._lock < 2) {
				pauseTween = _findNextPauseTween(this, _roundPrecise(prevTime), _roundPrecise(time));
				if (pauseTween) tTime -= time - (time = pauseTween._start);
			}
			this._tTime = tTime;
			this._time = time;
			this._act = !!timeScale;
			if (!this._initted) {
				this._onUpdate = this.vars.onUpdate;
				this._initted = 1;
				this._zTime = totalTime;
				prevTime = 0;
			}
			if (!prevTime && tTime && dur && !suppressEvents && !prevIteration) {
				_callback(this, "onStart");
				if (this._tTime !== tTime) return this;
			}
			if (time >= prevTime && totalTime >= 0) {
				child = this._first;
				while (child) {
					next = child._next;
					if ((child._act || time >= child._start) && child._ts && pauseTween !== child) {
						if (child.parent !== this) return this.render(totalTime, suppressEvents, force);
						child.render(child._ts > 0 ? (time - child._start) * child._ts : (child._dirty ? child.totalDuration() : child._tDur) + (time - child._start) * child._ts, suppressEvents, force);
						if (time !== this._time || !this._ts && !prevPaused) {
							pauseTween = 0;
							next && (tTime += this._zTime = -_tinyNum);
							break;
						}
					}
					child = next;
				}
			} else {
				child = this._last;
				var adjustedTime = totalTime < 0 ? totalTime : time;
				while (child) {
					next = child._prev;
					if ((child._act || adjustedTime <= child._end) && child._ts && pauseTween !== child) {
						if (child.parent !== this) return this.render(totalTime, suppressEvents, force);
						child.render(child._ts > 0 ? (adjustedTime - child._start) * child._ts : (child._dirty ? child.totalDuration() : child._tDur) + (adjustedTime - child._start) * child._ts, suppressEvents, force || _reverting$1 && _isRevertWorthy(child));
						if (time !== this._time || !this._ts && !prevPaused) {
							pauseTween = 0;
							next && (tTime += this._zTime = adjustedTime ? -_tinyNum : _tinyNum);
							break;
						}
					}
					child = next;
				}
			}
			if (pauseTween && !suppressEvents) {
				this.pause();
				pauseTween.render(time >= prevTime ? 0 : -_tinyNum)._zTime = time >= prevTime ? 1 : -1;
				if (this._ts) {
					this._start = prevStart;
					_setEnd(this);
					return this.render(totalTime, suppressEvents, force);
				}
			}
			this._onUpdate && !suppressEvents && _callback(this, "onUpdate", true);
			if (tTime === tDur && this._tTime >= this.totalDuration() || !tTime && prevTime) {
				if (prevStart === this._start || Math.abs(timeScale) !== Math.abs(this._ts)) {
					if (!this._lock) {
						(totalTime || !dur) && (tTime === tDur && this._ts > 0 || !tTime && this._ts < 0) && _removeFromParent(this, 1);
						if (!suppressEvents && !(totalTime < 0 && !prevTime) && (tTime || prevTime || !tDur)) {
							_callback(this, tTime === tDur && totalTime >= 0 ? "onComplete" : "onReverseComplete", true);
							this._prom && !(tTime < tDur && this.timeScale() > 0) && this._prom();
						}
					}
				}
			}
		}
		return this;
	};
	_proto2.add = function add(child, position) {
		var _this2 = this;
		_isNumber(position) || (position = _parsePosition(this, position, child));
		if (!(child instanceof Animation)) {
			if (_isArray(child)) {
				child.forEach(function(obj) {
					return _this2.add(obj, position);
				});
				return this;
			}
			if (_isString(child)) return this.addLabel(child, position);
			if (_isFunction(child)) child = Tween.delayedCall(0, child);
			else return this;
		}
		return this !== child ? _addToTimeline(this, child, position) : this;
	};
	_proto2.getChildren = function getChildren(nested, tweens, timelines, ignoreBeforeTime) {
		if (nested === void 0) nested = true;
		if (tweens === void 0) tweens = true;
		if (timelines === void 0) timelines = true;
		if (ignoreBeforeTime === void 0) ignoreBeforeTime = -_bigNum$1;
		var a = [], child = this._first;
		while (child) {
			if (child._start >= ignoreBeforeTime) if (child instanceof Tween) tweens && a.push(child);
			else {
				timelines && a.push(child);
				nested && a.push.apply(a, child.getChildren(true, tweens, timelines));
			}
			child = child._next;
		}
		return a;
	};
	_proto2.getById = function getById(id) {
		var animations = this.getChildren(1, 1, 1), i = animations.length;
		while (i--) if (animations[i].vars.id === id) return animations[i];
	};
	_proto2.remove = function remove(child) {
		if (_isString(child)) return this.removeLabel(child);
		if (_isFunction(child)) return this.killTweensOf(child);
		child.parent === this && _removeLinkedListItem(this, child);
		if (child === this._recent) this._recent = this._last;
		return _uncache(this);
	};
	_proto2.totalTime = function totalTime(_totalTime2, suppressEvents) {
		if (!arguments.length) return this._tTime;
		this._forcing = 1;
		if (!this._dp && this._ts) this._start = _roundPrecise(_ticker.time - (this._ts > 0 ? _totalTime2 / this._ts : (this.totalDuration() - _totalTime2) / -this._ts));
		_Animation.prototype.totalTime.call(this, _totalTime2, suppressEvents);
		this._forcing = 0;
		return this;
	};
	_proto2.addLabel = function addLabel(label, position) {
		this.labels[label] = _parsePosition(this, position);
		return this;
	};
	_proto2.removeLabel = function removeLabel(label) {
		delete this.labels[label];
		return this;
	};
	_proto2.addPause = function addPause(position, callback, params) {
		var t = Tween.delayedCall(0, callback || _emptyFunc, params);
		t.data = "isPause";
		this._hasPause = 1;
		return _addToTimeline(this, t, _parsePosition(this, position));
	};
	_proto2.removePause = function removePause(position) {
		var child = this._first;
		position = _parsePosition(this, position);
		while (child) {
			if (child._start === position && child.data === "isPause") _removeFromParent(child);
			child = child._next;
		}
	};
	_proto2.killTweensOf = function killTweensOf(targets, props, onlyActive) {
		var tweens = this.getTweensOf(targets, onlyActive), i = tweens.length;
		while (i--) _overwritingTween !== tweens[i] && tweens[i].kill(targets, props);
		return this;
	};
	_proto2.getTweensOf = function getTweensOf(targets, onlyActive) {
		var a = [], parsedTargets = toArray(targets), child = this._first, isGlobalTime = _isNumber(onlyActive), children;
		while (child) {
			if (child instanceof Tween) {
				if (_arrayContainsAny(child._targets, parsedTargets) && (isGlobalTime ? (!_overwritingTween || child._initted && child._ts) && child.globalTime(0) <= onlyActive && child.globalTime(child.totalDuration()) > onlyActive : !onlyActive || child.isActive())) a.push(child);
			} else if ((children = child.getTweensOf(parsedTargets, onlyActive)).length) a.push.apply(a, children);
			child = child._next;
		}
		return a;
	};
	_proto2.tweenTo = function tweenTo(position, vars) {
		vars = vars || {};
		var tl = this, endTime = _parsePosition(tl, position), _vars = vars, startAt = _vars.startAt, _onStart = _vars.onStart, onStartParams = _vars.onStartParams, immediateRender = _vars.immediateRender, initted, tween = Tween.to(tl, _setDefaults({
			ease: vars.ease || "none",
			lazy: false,
			immediateRender: false,
			time: endTime,
			overwrite: "auto",
			duration: vars.duration || Math.abs((endTime - (startAt && "time" in startAt ? startAt.time : tl._time)) / tl.timeScale()) || _tinyNum,
			onStart: function onStart() {
				tl.pause();
				if (!initted) {
					var duration = vars.duration || Math.abs((endTime - (startAt && "time" in startAt ? startAt.time : tl._time)) / tl.timeScale());
					tween._dur !== duration && _setDuration(tween, duration, 0, 1).render(tween._time, true, true);
					initted = 1;
				}
				_onStart && _onStart.apply(tween, onStartParams || []);
			}
		}, vars));
		return immediateRender ? tween.render(0) : tween;
	};
	_proto2.tweenFromTo = function tweenFromTo(fromPosition, toPosition, vars) {
		return this.tweenTo(toPosition, _setDefaults({ startAt: { time: _parsePosition(this, fromPosition) } }, vars));
	};
	_proto2.recent = function recent() {
		return this._recent;
	};
	_proto2.nextLabel = function nextLabel(afterTime) {
		if (afterTime === void 0) afterTime = this._time;
		return _getLabelInDirection(this, _parsePosition(this, afterTime));
	};
	_proto2.previousLabel = function previousLabel(beforeTime) {
		if (beforeTime === void 0) beforeTime = this._time;
		return _getLabelInDirection(this, _parsePosition(this, beforeTime), 1);
	};
	_proto2.currentLabel = function currentLabel(value) {
		return arguments.length ? this.seek(value, true) : this.previousLabel(this._time + _tinyNum);
	};
	_proto2.shiftChildren = function shiftChildren(amount, adjustLabels, ignoreBeforeTime) {
		if (ignoreBeforeTime === void 0) ignoreBeforeTime = 0;
		var child = this._first, labels = this.labels, p;
		amount = _roundPrecise(amount);
		while (child) {
			if (child._start >= ignoreBeforeTime) {
				child._start += amount;
				child._end += amount;
			}
			child = child._next;
		}
		if (adjustLabels) {
			for (p in labels) if (labels[p] >= ignoreBeforeTime) labels[p] += amount;
		}
		return _uncache(this);
	};
	_proto2.invalidate = function invalidate(soft) {
		var child = this._first;
		this._lock = 0;
		while (child) {
			child.invalidate(soft);
			child = child._next;
		}
		return _Animation.prototype.invalidate.call(this, soft);
	};
	_proto2.clear = function clear(includeLabels) {
		if (includeLabels === void 0) includeLabels = true;
		var child = this._first, next;
		while (child) {
			next = child._next;
			this.remove(child);
			child = next;
		}
		this._dp && (this._time = this._tTime = this._pTime = 0);
		includeLabels && (this.labels = {});
		return _uncache(this);
	};
	_proto2.totalDuration = function totalDuration(value) {
		var max = 0, self = this, child = self._last, prevStart = _bigNum$1, prev, start, parent;
		if (arguments.length) return self.timeScale((self._repeat < 0 ? self.duration() : self.totalDuration()) / (self.reversed() ? -value : value));
		if (self._dirty) {
			parent = self.parent;
			while (child) {
				prev = child._prev;
				child._dirty && child.totalDuration();
				start = child._start;
				if (start > prevStart && self._sort && child._ts && !self._lock) {
					self._lock = 1;
					_addToTimeline(self, child, start - child._delay, 1)._lock = 0;
				} else prevStart = start;
				if (start < 0 && child._ts) {
					max -= start;
					if (!parent && !self._dp || parent && parent.smoothChildTiming) {
						self._start += _roundPrecise(start / self._ts);
						self._time -= start;
						self._tTime -= start;
					}
					self.shiftChildren(-start, false, -Infinity);
					prevStart = 0;
				}
				child._end > max && child._ts && (max = child._end);
				child = prev;
			}
			_setDuration(self, self === _globalTimeline && self._time > max ? self._time : max, 1, 1);
			self._dirty = 0;
		}
		return self._tDur;
	};
	Timeline.updateRoot = function updateRoot(time) {
		if (_globalTimeline._ts) {
			_lazySafeRender(_globalTimeline, _parentToChildTotalTime(time, _globalTimeline));
			_lastRenderedFrame = _ticker.frame;
		}
		if (_ticker.frame >= _nextGCFrame) {
			_nextGCFrame += _config.autoSleep || 120;
			var child = _globalTimeline._first;
			if (!child || !child._ts) {
				if (_config.autoSleep && _ticker._listeners.length < 2) {
					while (child && !child._ts) child = child._next;
					child || _ticker.sleep();
				}
			}
		}
	};
	return Timeline;
}(Animation);
_setDefaults(Timeline.prototype, {
	_lock: 0,
	_hasPause: 0,
	_forcing: 0
});
var _addComplexStringPropTween = function _addComplexStringPropTween(target, prop, start, end, setter, stringFilter, funcParam) {
	var pt = new PropTween(this._pt, target, prop, 0, 1, _renderComplexString, null, setter), index = 0, matchIndex = 0, result, startNums, color, endNum, chunk, startNum, hasRandom, a;
	pt.b = start;
	pt.e = end;
	start += "";
	end += "";
	if (hasRandom = ~end.indexOf("random(")) end = _replaceRandom(end);
	if (stringFilter) {
		a = [start, end];
		stringFilter(a, target, prop);
		start = a[0];
		end = a[1];
	}
	startNums = start.match(_complexStringNumExp) || [];
	while (result = _complexStringNumExp.exec(end)) {
		endNum = result[0];
		chunk = end.substring(index, result.index);
		if (color) color = (color + 1) % 5;
		else if (chunk.substr(-5) === "rgba(") color = 1;
		if (endNum !== startNums[matchIndex++]) {
			startNum = parseFloat(startNums[matchIndex - 1]) || 0;
			pt._pt = {
				_next: pt._pt,
				p: chunk || matchIndex === 1 ? chunk : ",",
				s: startNum,
				c: endNum.charAt(1) === "=" ? _parseRelative(startNum, endNum) - startNum : parseFloat(endNum) - startNum,
				m: color && color < 4 ? Math.round : 0
			};
			index = _complexStringNumExp.lastIndex;
		}
	}
	pt.c = index < end.length ? end.substring(index, end.length) : "";
	pt.fp = funcParam;
	if (_relExp.test(end) || hasRandom) pt.e = 0;
	this._pt = pt;
	return pt;
};
var _addPropTween = function _addPropTween(target, prop, start, end, index, targets, modifier, stringFilter, funcParam, optional) {
	_isFunction(end) && (end = end(index || 0, target, targets));
	var currentValue = target[prop], parsedStart = start !== "get" ? start : !_isFunction(currentValue) ? currentValue : funcParam ? target[prop.indexOf("set") || !_isFunction(target["get" + prop.substr(3)]) ? prop : "get" + prop.substr(3)](funcParam) : target[prop](), setter = !_isFunction(currentValue) ? _setterPlain : funcParam ? _setterFuncWithParam : _setterFunc, pt;
	if (_isString(end)) {
		if (~end.indexOf("random(")) end = _replaceRandom(end);
		if (end.charAt(1) === "=") {
			pt = _parseRelative(parsedStart, end) + (getUnit(parsedStart) || 0);
			if (pt || pt === 0) end = pt;
		}
	}
	if (!optional || parsedStart !== end || _forceAllPropTweens) {
		if (!isNaN(parsedStart * end) && end !== "") {
			pt = new PropTween(this._pt, target, prop, +parsedStart || 0, end - (parsedStart || 0), typeof currentValue === "boolean" ? _renderBoolean : _renderPlain, 0, setter);
			funcParam && (pt.fp = funcParam);
			modifier && pt.modifier(modifier, this, target);
			return this._pt = pt;
		}
		!currentValue && !(prop in target) && _missingPlugin(prop, end);
		return _addComplexStringPropTween.call(this, target, prop, parsedStart, end, setter, stringFilter || _config.stringFilter, funcParam);
	}
};
var _processVars = function _processVars(vars, index, target, targets, tween) {
	_isFunction(vars) && (vars = _parseFuncOrString(vars, tween, index, target, targets));
	if (!_isObject(vars) || vars.style && vars.nodeType || _isArray(vars) || _isTypedArray(vars)) return _isString(vars) ? _parseFuncOrString(vars, tween, index, target, targets) : vars;
	var copy = {}, p;
	for (p in vars) copy[p] = _parseFuncOrString(vars[p], tween, index, target, targets);
	return copy;
};
var _checkPlugin = function _checkPlugin(property, vars, tween, index, target, targets) {
	var plugin, pt, ptLookup, i;
	if (_plugins[property] && (plugin = new _plugins[property]()).init(target, plugin.rawVars ? vars[property] : _processVars(vars[property], index, target, targets, tween), tween, index, targets) !== false) {
		tween._pt = pt = new PropTween(tween._pt, target, property, 0, 1, plugin.render, plugin, 0, plugin.priority);
		if (tween !== _quickTween) {
			ptLookup = tween._ptLookup[tween._targets.indexOf(target)];
			i = plugin._props.length;
			while (i--) ptLookup[plugin._props[i]] = pt;
		}
	}
	return plugin;
};
var _overwritingTween;
var _forceAllPropTweens;
var _initTween = function _initTween(tween, time, tTime) {
	var vars = tween.vars, ease = vars.ease, startAt = vars.startAt, immediateRender = vars.immediateRender, lazy = vars.lazy, onUpdate = vars.onUpdate, runBackwards = vars.runBackwards, yoyoEase = vars.yoyoEase, keyframes = vars.keyframes, autoRevert = vars.autoRevert, dur = tween._dur, prevStartAt = tween._startAt, targets = tween._targets, parent = tween.parent, fullTargets = parent && parent.data === "nested" ? parent.vars.targets : targets, autoOverwrite = tween._overwrite === "auto" && !_suppressOverwrites, tl = tween.timeline, reverseEase = vars.easeReverse || yoyoEase, cleanVars, i, p, pt, target, hasPriority, gsData, harness, plugin, ptLookup, index, harnessVars, overwritten;
	tl && (!keyframes || !ease) && (ease = "none");
	tween._ease = _parseEase(ease, _defaults.ease);
	tween._rEase = reverseEase && (_parseEase(reverseEase) || tween._ease);
	tween._from = !tl && !!vars.runBackwards;
	if (tween._from) tween.ratio = 1;
	if (!tl || keyframes && !vars.stagger) {
		harness = targets[0] ? _getCache(targets[0]).harness : 0;
		harnessVars = harness && vars[harness.prop];
		cleanVars = _copyExcluding(vars, _reservedProps);
		if (prevStartAt) {
			prevStartAt._zTime < 0 && prevStartAt.progress(1);
			time < 0 && runBackwards && immediateRender && !autoRevert ? prevStartAt.render(-1, true) : prevStartAt.revert(runBackwards && dur ? _revertConfigNoKill : _startAtRevertConfig);
			prevStartAt._lazy = 0;
		}
		if (startAt) {
			_removeFromParent(tween._startAt = Tween.set(targets, _setDefaults({
				data: "isStart",
				overwrite: false,
				parent,
				immediateRender: true,
				lazy: !prevStartAt && _isNotFalse(lazy),
				startAt: null,
				delay: 0,
				onUpdate: onUpdate && function() {
					return _callback(tween, "onUpdate");
				},
				stagger: 0
			}, startAt)));
			tween._startAt._dp = 0;
			tween._startAt._sat = tween;
			time < 0 && (_reverting$1 || !immediateRender && !autoRevert) && tween._startAt.revert(_revertConfigNoKill);
			if (immediateRender) {
				if (dur && time <= 0 && tTime <= 0) {
					time && (tween._zTime = time);
					return;
				}
			}
		} else if (runBackwards && dur) {
			if (!prevStartAt) {
				time && (immediateRender = false);
				p = _setDefaults({
					overwrite: false,
					data: "isFromStart",
					lazy: immediateRender && !prevStartAt && _isNotFalse(lazy),
					immediateRender,
					stagger: 0,
					parent
				}, cleanVars);
				harnessVars && (p[harness.prop] = harnessVars);
				_removeFromParent(tween._startAt = Tween.set(targets, p));
				tween._startAt._dp = 0;
				tween._startAt._sat = tween;
				time < 0 && (_reverting$1 ? tween._startAt.revert(_revertConfigNoKill) : tween._startAt.render(-1, true));
				tween._zTime = time;
				if (!immediateRender) _initTween(tween._startAt, _tinyNum, _tinyNum);
				else if (!time) return;
			}
		}
		tween._pt = tween._ptCache = 0;
		lazy = dur && _isNotFalse(lazy) || lazy && !dur;
		for (i = 0; i < targets.length; i++) {
			target = targets[i];
			gsData = target._gsap || _harness(targets)[i]._gsap;
			tween._ptLookup[i] = ptLookup = {};
			_lazyLookup[gsData.id] && _lazyTweens.length && _lazyRender();
			index = fullTargets === targets ? i : fullTargets.indexOf(target);
			if (harness && (plugin = new harness()).init(target, harnessVars || cleanVars, tween, index, fullTargets) !== false) {
				tween._pt = pt = new PropTween(tween._pt, target, plugin.name, 0, 1, plugin.render, plugin, 0, plugin.priority);
				plugin._props.forEach(function(name) {
					ptLookup[name] = pt;
				});
				plugin.priority && (hasPriority = 1);
			}
			if (!harness || harnessVars) for (p in cleanVars) if (_plugins[p] && (plugin = _checkPlugin(p, cleanVars, tween, index, target, fullTargets))) plugin.priority && (hasPriority = 1);
			else ptLookup[p] = pt = _addPropTween.call(tween, target, p, "get", cleanVars[p], index, fullTargets, 0, vars.stringFilter);
			tween._op && tween._op[i] && tween.kill(target, tween._op[i]);
			if (autoOverwrite && tween._pt) {
				_overwritingTween = tween;
				_globalTimeline.killTweensOf(target, ptLookup, tween.globalTime(time));
				overwritten = !tween.parent;
				_overwritingTween = 0;
			}
			tween._pt && lazy && (_lazyLookup[gsData.id] = 1);
		}
		hasPriority && _sortPropTweensByPriority(tween);
		tween._onInit && tween._onInit(tween);
	}
	tween._onUpdate = onUpdate;
	tween._initted = (!tween._op || tween._pt) && !overwritten;
	keyframes && time <= 0 && tl.render(_bigNum$1, true, true);
};
var _updatePropTweens = function _updatePropTweens(tween, property, value, start, startIsRelative, ratio, time, skipRecursion) {
	var ptCache = (tween._pt && tween._ptCache || (tween._ptCache = {}))[property], pt, rootPT, lookup, i;
	if (!ptCache) {
		ptCache = tween._ptCache[property] = [];
		lookup = tween._ptLookup;
		i = tween._targets.length;
		while (i--) {
			pt = lookup[i][property];
			if (pt && pt.d && pt.d._pt) {
				pt = pt.d._pt;
				while (pt && pt.p !== property && pt.fp !== property) pt = pt._next;
			}
			if (!pt) {
				_forceAllPropTweens = 1;
				tween.vars[property] = "+=0";
				_initTween(tween, time);
				_forceAllPropTweens = 0;
				return skipRecursion ? _warn(property + " not eligible for reset. Try splitting into individual properties") : 1;
			}
			ptCache.push(pt);
		}
	}
	i = ptCache.length;
	while (i--) {
		rootPT = ptCache[i];
		pt = rootPT._pt || rootPT;
		pt.s = (start || start === 0) && !startIsRelative ? start : pt.s + (start || 0) + ratio * pt.c;
		pt.c = value - pt.s;
		rootPT.e && (rootPT.e = _round(value) + getUnit(rootPT.e));
		rootPT.b && (rootPT.b = pt.s + getUnit(rootPT.b));
	}
};
var _addAliasesToVars = function _addAliasesToVars(targets, vars) {
	var harness = targets[0] ? _getCache(targets[0]).harness : 0, propertyAliases = harness && harness.aliases, copy, p, i, aliases;
	if (!propertyAliases) return vars;
	copy = _merge({}, vars);
	for (p in propertyAliases) if (p in copy) {
		aliases = propertyAliases[p].split(",");
		i = aliases.length;
		while (i--) copy[aliases[i]] = copy[p];
	}
	return copy;
};
var _parseKeyframe = function _parseKeyframe(prop, obj, allProps, easeEach) {
	var ease = obj.ease || easeEach || "power1.inOut", p, a;
	if (_isArray(obj)) {
		a = allProps[prop] || (allProps[prop] = []);
		obj.forEach(function(value, i) {
			return a.push({
				t: i / (obj.length - 1) * 100,
				v: value,
				e: ease
			});
		});
	} else for (p in obj) {
		a = allProps[p] || (allProps[p] = []);
		p === "ease" || a.push({
			t: parseFloat(prop),
			v: obj[p],
			e: ease
		});
	}
};
var _parseFuncOrString = function _parseFuncOrString(value, tween, i, target, targets) {
	return _isFunction(value) ? value.call(tween, i, target, targets) : _isString(value) && ~value.indexOf("random(") ? _replaceRandom(value) : value;
};
var _staggerTweenProps = _callbackNames + "repeat,repeatDelay,yoyo,repeatRefresh,yoyoEase,easeReverse,autoRevert";
var _staggerPropsToSkip = {};
_forEachName(_staggerTweenProps + ",id,stagger,delay,duration,paused,scrollTrigger", function(name) {
	return _staggerPropsToSkip[name] = 1;
});
var Tween = /*#__PURE__*/ function(_Animation2) {
	_inheritsLoose(Tween, _Animation2);
	function Tween(targets, vars, position, skipInherit) {
		var _this3;
		if (typeof vars === "number") {
			position.duration = vars;
			vars = position;
			position = null;
		}
		_this3 = _Animation2.call(this, skipInherit ? vars : _inheritDefaults(vars)) || this;
		var _this3$vars = _this3.vars, duration = _this3$vars.duration, delay = _this3$vars.delay, immediateRender = _this3$vars.immediateRender, stagger = _this3$vars.stagger, overwrite = _this3$vars.overwrite, keyframes = _this3$vars.keyframes, defaults = _this3$vars.defaults, scrollTrigger = _this3$vars.scrollTrigger, parent = vars.parent || _globalTimeline, parsedTargets = (_isArray(targets) || _isTypedArray(targets) ? _isNumber(targets[0]) : "length" in vars) ? [targets] : toArray(targets), tl, i, copy, l, p, curTarget, staggerFunc, staggerVarsToMerge;
		_this3._targets = parsedTargets.length ? _harness(parsedTargets) : _warn("GSAP target " + targets + " not found. https://gsap.com", !_config.nullTargetWarn) || [];
		_this3._ptLookup = [];
		_this3._overwrite = overwrite;
		if (keyframes || stagger || _isFuncOrString(duration) || _isFuncOrString(delay)) {
			vars = _this3.vars;
			var easeReverse = vars.easeReverse || vars.yoyoEase;
			tl = _this3.timeline = new Timeline({
				data: "nested",
				defaults: defaults || {},
				targets: parent && parent.data === "nested" ? parent.vars.targets : parsedTargets
			});
			tl.kill();
			tl.parent = tl._dp = _assertThisInitialized(_this3);
			tl._start = 0;
			if (stagger || _isFuncOrString(duration) || _isFuncOrString(delay)) {
				l = parsedTargets.length;
				staggerFunc = stagger && distribute(stagger);
				if (_isObject(stagger)) {
					for (p in stagger) if (~_staggerTweenProps.indexOf(p)) {
						staggerVarsToMerge || (staggerVarsToMerge = {});
						staggerVarsToMerge[p] = stagger[p];
					}
				}
				for (i = 0; i < l; i++) {
					copy = _copyExcluding(vars, _staggerPropsToSkip);
					copy.stagger = 0;
					easeReverse && (copy.easeReverse = easeReverse);
					staggerVarsToMerge && _merge(copy, staggerVarsToMerge);
					curTarget = parsedTargets[i];
					copy.duration = +_parseFuncOrString(duration, _assertThisInitialized(_this3), i, curTarget, parsedTargets);
					copy.delay = (+_parseFuncOrString(delay, _assertThisInitialized(_this3), i, curTarget, parsedTargets) || 0) - _this3._delay;
					if (!stagger && l === 1 && copy.delay) {
						_this3._delay = delay = copy.delay;
						_this3._start += delay;
						copy.delay = 0;
					}
					tl.to(curTarget, copy, staggerFunc ? staggerFunc(i, curTarget, parsedTargets) : 0);
					tl._ease = _easeMap.none;
				}
				tl.duration() ? duration = delay = 0 : _this3.timeline = 0;
			} else if (keyframes) {
				_inheritDefaults(_setDefaults(tl.vars.defaults, { ease: "none" }));
				tl._ease = _parseEase(keyframes.ease || vars.ease || "none");
				var time = 0, a, kf, v;
				if (_isArray(keyframes)) {
					keyframes.forEach(function(frame) {
						return tl.to(parsedTargets, frame, ">");
					});
					tl.duration();
				} else {
					copy = {};
					for (p in keyframes) p === "ease" || p === "easeEach" || _parseKeyframe(p, keyframes[p], copy, keyframes.easeEach);
					for (p in copy) {
						a = copy[p].sort(function(a, b) {
							return a.t - b.t;
						});
						time = 0;
						for (i = 0; i < a.length; i++) {
							kf = a[i];
							v = {
								ease: kf.e,
								duration: (kf.t - (i ? a[i - 1].t : 0)) / 100 * duration
							};
							v[p] = kf.v;
							tl.to(parsedTargets, v, time);
							time += v.duration;
						}
					}
					tl.duration() < duration && tl.to({}, { duration: duration - tl.duration() });
				}
			}
			duration || _this3.duration(duration = tl.duration());
		} else _this3.timeline = 0;
		if (overwrite === true && !_suppressOverwrites) {
			_overwritingTween = _assertThisInitialized(_this3);
			_globalTimeline.killTweensOf(parsedTargets);
			_overwritingTween = 0;
		}
		_addToTimeline(parent, _assertThisInitialized(_this3), position);
		vars.reversed && _this3.reverse();
		vars.paused && _this3.paused(true);
		if (immediateRender || !duration && !keyframes && _this3._start === _roundPrecise(parent._time) && _isNotFalse(immediateRender) && _hasNoPausedAncestors(_assertThisInitialized(_this3)) && parent.data !== "nested") {
			_this3._tTime = -_tinyNum;
			_this3.render(Math.max(0, -delay) || 0);
		}
		scrollTrigger && _scrollTrigger(_assertThisInitialized(_this3), scrollTrigger);
		return _this3;
	}
	var _proto3 = Tween.prototype;
	_proto3.render = function render(totalTime, suppressEvents, force) {
		var prevTime = this._time, tDur = this._tDur, dur = this._dur, isNegative = totalTime < 0, tTime = totalTime > tDur - _tinyNum && !isNegative ? tDur : totalTime < _tinyNum ? 0 : totalTime, time, pt, iteration, cycleDuration, prevIteration, isYoyo, ratio, timeline;
		if (!dur) _renderZeroDurationTween(this, totalTime, suppressEvents, force);
		else if (tTime !== this._tTime || !totalTime || force || !this._initted && this._tTime || this._startAt && this._zTime < 0 !== isNegative || this._lazy) {
			time = tTime;
			timeline = this.timeline;
			if (this._repeat) {
				cycleDuration = dur + this._rDelay;
				if (this._repeat < -1 && isNegative) return this.totalTime(cycleDuration * 100 + totalTime, suppressEvents, force);
				time = _roundPrecise(tTime % cycleDuration);
				if (tTime === tDur) {
					iteration = this._repeat;
					time = dur;
				} else {
					prevIteration = _roundPrecise(tTime / cycleDuration);
					iteration = ~~prevIteration;
					if (iteration && iteration === prevIteration) {
						time = dur;
						iteration--;
					} else if (time > dur) time = dur;
				}
				isYoyo = this._yoyo && iteration & 1;
				if (isYoyo) time = dur - time;
				prevIteration = _animationCycle(this._tTime, cycleDuration);
				if (time === prevTime && !force && this._initted && iteration === prevIteration) {
					this._tTime = tTime;
					return this;
				}
				if (iteration !== prevIteration) {
					if (this.vars.repeatRefresh && !isYoyo && !this._lock && time !== cycleDuration && this._initted) {
						this._lock = force = 1;
						this.render(_roundPrecise(cycleDuration * iteration), true).invalidate()._lock = 0;
					}
				}
			}
			if (!this._initted) {
				if (_attemptInitTween(this, isNegative ? totalTime : time, force, suppressEvents, tTime)) {
					this._tTime = 0;
					return this;
				}
				if (prevTime !== this._time && !(force && this.vars.repeatRefresh && iteration !== prevIteration)) return this;
				if (dur !== this._dur) return this.render(totalTime, suppressEvents, force);
			}
			if (this._rEase) {
				var inv = time < prevTime;
				if (inv !== this._inv) {
					var segDur = inv ? prevTime : dur - prevTime;
					this._inv = inv;
					if (this._from) this.ratio = 1 - this.ratio;
					this._invRatio = this.ratio;
					this._invTime = prevTime;
					this._invRecip = segDur ? (inv ? -1 : 1) / segDur : 0;
					this._invScale = inv ? -this.ratio : 1 - this.ratio;
					this._invEase = inv ? this._rEase : this._ease;
				}
				this.ratio = ratio = this._invRatio + this._invScale * this._invEase((time - this._invTime) * this._invRecip);
			} else this.ratio = ratio = this._ease(time / dur);
			if (this._from) this.ratio = ratio = 1 - ratio;
			this._tTime = tTime;
			this._time = time;
			if (!this._act && this._ts) {
				this._act = 1;
				this._lazy = 0;
			}
			if (!prevTime && tTime && !suppressEvents && !prevIteration) {
				_callback(this, "onStart");
				if (this._tTime !== tTime) return this;
			}
			pt = this._pt;
			while (pt) {
				pt.r(ratio, pt.d);
				pt = pt._next;
			}
			timeline && timeline.render(totalTime < 0 ? totalTime : timeline._dur * timeline._ease(time / this._dur), suppressEvents, force) || this._startAt && (this._zTime = totalTime);
			if (this._onUpdate && !suppressEvents) {
				isNegative && _rewindStartAt(this, totalTime, suppressEvents, force);
				_callback(this, "onUpdate");
			}
			this._repeat && iteration !== prevIteration && this.vars.onRepeat && !suppressEvents && this.parent && _callback(this, "onRepeat");
			if ((tTime === this._tDur || !tTime) && this._tTime === tTime) {
				isNegative && !this._onUpdate && _rewindStartAt(this, totalTime, true, true);
				(totalTime || !dur) && (tTime === this._tDur && this._ts > 0 || !tTime && this._ts < 0) && _removeFromParent(this, 1);
				if (!suppressEvents && !(isNegative && !prevTime) && (tTime || prevTime || isYoyo)) {
					_callback(this, tTime === tDur ? "onComplete" : "onReverseComplete", true);
					this._prom && !(tTime < tDur && this.timeScale() > 0) && this._prom();
				}
			}
		}
		return this;
	};
	_proto3.targets = function targets() {
		return this._targets;
	};
	_proto3.invalidate = function invalidate(soft) {
		(!soft || !this.vars.runBackwards) && (this._startAt = 0);
		this._pt = this._op = this._onUpdate = this._lazy = this.ratio = 0;
		this._ptLookup = [];
		this.timeline && this.timeline.invalidate(soft);
		return _Animation2.prototype.invalidate.call(this, soft);
	};
	_proto3.resetTo = function resetTo(property, value, start, startIsRelative, skipRecursion) {
		_tickerActive || _ticker.wake();
		this._ts || this.play();
		var time = Math.min(this._dur, (this._dp._time - this._start) * this._ts), ratio;
		this._initted || _initTween(this, time);
		ratio = this._ease(time / this._dur);
		if (_updatePropTweens(this, property, value, start, startIsRelative, ratio, time, skipRecursion)) return this.resetTo(property, value, start, startIsRelative, 1);
		_alignPlayhead(this, 0);
		this.parent || _addLinkedListItem(this._dp, this, "_first", "_last", this._dp._sort ? "_start" : 0);
		return this.render(0);
	};
	_proto3.kill = function kill(targets, vars) {
		if (vars === void 0) vars = "all";
		if (!targets && (!vars || vars === "all")) {
			this._lazy = this._pt = 0;
			this.parent ? _interrupt(this) : this.scrollTrigger && this.scrollTrigger.kill(!!_reverting$1);
			return this;
		}
		if (this.timeline) {
			var tDur = this.timeline.totalDuration();
			this.timeline.killTweensOf(targets, vars, _overwritingTween && _overwritingTween.vars.overwrite !== true)._first || _interrupt(this);
			this.parent && tDur !== this.timeline.totalDuration() && _setDuration(this, this._dur * this.timeline._tDur / tDur, 0, 1);
			return this;
		}
		var parsedTargets = this._targets, killingTargets = targets ? toArray(targets) : parsedTargets, propTweenLookup = this._ptLookup, firstPT = this._pt, overwrittenProps, curLookup, curOverwriteProps, props, p, pt, i;
		if ((!vars || vars === "all") && _arraysMatch(parsedTargets, killingTargets)) {
			vars === "all" && (this._pt = 0);
			return _interrupt(this);
		}
		overwrittenProps = this._op = this._op || [];
		if (vars !== "all") {
			if (_isString(vars)) {
				p = {};
				_forEachName(vars, function(name) {
					return p[name] = 1;
				});
				vars = p;
			}
			vars = _addAliasesToVars(parsedTargets, vars);
		}
		i = parsedTargets.length;
		while (i--) if (~killingTargets.indexOf(parsedTargets[i])) {
			curLookup = propTweenLookup[i];
			if (vars === "all") {
				overwrittenProps[i] = vars;
				props = curLookup;
				curOverwriteProps = {};
			} else {
				curOverwriteProps = overwrittenProps[i] = overwrittenProps[i] || {};
				props = vars;
			}
			for (p in props) {
				pt = curLookup && curLookup[p];
				if (pt) {
					if (!("kill" in pt.d) || pt.d.kill(p) === true) _removeLinkedListItem(this, pt, "_pt");
					delete curLookup[p];
				}
				if (curOverwriteProps !== "all") curOverwriteProps[p] = 1;
			}
		}
		this._initted && !this._pt && firstPT && _interrupt(this);
		return this;
	};
	Tween.to = function to(targets, vars) {
		return new Tween(targets, vars, arguments[2]);
	};
	Tween.from = function from(targets, vars) {
		return _createTweenType(1, arguments);
	};
	Tween.delayedCall = function delayedCall(delay, callback, params, scope) {
		return new Tween(callback, 0, {
			immediateRender: false,
			lazy: false,
			overwrite: false,
			delay,
			onComplete: callback,
			onReverseComplete: callback,
			onCompleteParams: params,
			onReverseCompleteParams: params,
			callbackScope: scope
		});
	};
	Tween.fromTo = function fromTo(targets, fromVars, toVars) {
		return _createTweenType(2, arguments);
	};
	Tween.set = function set(targets, vars) {
		vars.duration = 0;
		vars.repeatDelay || (vars.repeat = 0);
		return new Tween(targets, vars);
	};
	Tween.killTweensOf = function killTweensOf(targets, props, onlyActive) {
		return _globalTimeline.killTweensOf(targets, props, onlyActive);
	};
	return Tween;
}(Animation);
_setDefaults(Tween.prototype, {
	_targets: [],
	_lazy: 0,
	_startAt: 0,
	_op: 0,
	_onInit: 0
});
_forEachName("staggerTo,staggerFrom,staggerFromTo", function(name) {
	Tween[name] = function() {
		var tl = new Timeline(), params = _slice.call(arguments, 0);
		params.splice(name === "staggerFromTo" ? 5 : 4, 0, 0);
		return tl[name].apply(tl, params);
	};
});
var _setterPlain = function _setterPlain(target, property, value) {
	return target[property] = value;
};
var _setterFunc = function _setterFunc(target, property, value) {
	return target[property](value);
};
var _setterFuncWithParam = function _setterFuncWithParam(target, property, value, data) {
	return target[property](data.fp, value);
};
var _setterAttribute = function _setterAttribute(target, property, value) {
	return target.setAttribute(property, value);
};
var _getSetter = function _getSetter(target, property) {
	return _isFunction(target[property]) ? _setterFunc : _isUndefined(target[property]) && target.setAttribute ? _setterAttribute : _setterPlain;
};
var _renderPlain = function _renderPlain(ratio, data) {
	return data.set(data.t, data.p, Math.round((data.s + data.c * ratio) * 1e6) / 1e6, data);
};
var _renderBoolean = function _renderBoolean(ratio, data) {
	return data.set(data.t, data.p, !!(data.s + data.c * ratio), data);
};
var _renderComplexString = function _renderComplexString(ratio, data) {
	var pt = data._pt, s = "";
	if (!ratio && data.b) s = data.b;
	else if (ratio === 1 && data.e) s = data.e;
	else {
		while (pt) {
			s = pt.p + (pt.m ? pt.m(pt.s + pt.c * ratio) : Math.round((pt.s + pt.c * ratio) * 1e4) / 1e4) + s;
			pt = pt._next;
		}
		s += data.c;
	}
	data.set(data.t, data.p, s, data);
};
var _renderPropTweens = function _renderPropTweens(ratio, data) {
	var pt = data._pt;
	while (pt) {
		pt.r(ratio, pt.d);
		pt = pt._next;
	}
};
var _addPluginModifier = function _addPluginModifier(modifier, tween, target, property) {
	var pt = this._pt, next;
	while (pt) {
		next = pt._next;
		pt.p === property && pt.modifier(modifier, tween, target);
		pt = next;
	}
};
var _killPropTweensOf = function _killPropTweensOf(property) {
	var pt = this._pt, hasNonDependentRemaining, next;
	while (pt) {
		next = pt._next;
		if (pt.p === property && !pt.op || pt.op === property) _removeLinkedListItem(this, pt, "_pt");
		else if (!pt.dep) hasNonDependentRemaining = 1;
		pt = next;
	}
	return !hasNonDependentRemaining;
};
var _setterWithModifier = function _setterWithModifier(target, property, value, data) {
	data.mSet(target, property, data.m.call(data.tween, value, data.mt), data);
};
var _sortPropTweensByPriority = function _sortPropTweensByPriority(parent) {
	var pt = parent._pt, next, pt2, first, last;
	while (pt) {
		next = pt._next;
		pt2 = first;
		while (pt2 && pt2.pr > pt.pr) pt2 = pt2._next;
		if (pt._prev = pt2 ? pt2._prev : last) pt._prev._next = pt;
		else first = pt;
		if (pt._next = pt2) pt2._prev = pt;
		else last = pt;
		pt = next;
	}
	parent._pt = first;
};
var PropTween = /*#__PURE__*/ function() {
	function PropTween(next, target, prop, start, change, renderer, data, setter, priority) {
		this.t = target;
		this.s = start;
		this.c = change;
		this.p = prop;
		this.r = renderer || _renderPlain;
		this.d = data || this;
		this.set = setter || _setterPlain;
		this.pr = priority || 0;
		this._next = next;
		if (next) next._prev = this;
	}
	var _proto4 = PropTween.prototype;
	_proto4.modifier = function modifier(func, tween, target) {
		this.mSet = this.mSet || this.set;
		this.set = _setterWithModifier;
		this.m = func;
		this.mt = target;
		this.tween = tween;
	};
	return PropTween;
}();
_forEachName(_callbackNames + "parent,duration,ease,delay,overwrite,runBackwards,startAt,yoyo,immediateRender,repeat,repeatDelay,data,paused,reversed,lazy,callbackScope,stringFilter,id,yoyoEase,stagger,inherit,repeatRefresh,keyframes,autoRevert,scrollTrigger,easeReverse", function(name) {
	return _reservedProps[name] = 1;
});
_globals.TweenMax = _globals.TweenLite = Tween;
_globals.TimelineLite = _globals.TimelineMax = Timeline;
_globalTimeline = new Timeline({
	sortChildren: false,
	defaults: _defaults,
	autoRemoveChildren: true,
	id: "root",
	smoothChildTiming: true
});
_config.stringFilter = _colorStringFilter;
var _media = [];
var _listeners = {};
var _emptyArray = [];
var _lastMediaTime = 0;
var _contextID = 0;
var _dispatch = function _dispatch(type) {
	return (_listeners[type] || _emptyArray).map(function(f) {
		return f();
	});
};
var _onMediaChange = function _onMediaChange() {
	var time = Date.now(), matches = [];
	if (time - _lastMediaTime > 2) {
		_dispatch("matchMediaInit");
		_media.forEach(function(c) {
			var queries = c.queries, conditions = c.conditions, match, p, anyMatch, toggled;
			for (p in queries) {
				match = _win$1.matchMedia(queries[p]).matches;
				match && (anyMatch = 1);
				if (match !== conditions[p]) {
					conditions[p] = match;
					toggled = 1;
				}
			}
			if (toggled) {
				c.revert();
				anyMatch && matches.push(c);
			}
		});
		_dispatch("matchMediaRevert");
		matches.forEach(function(c) {
			return c.onMatch(c, function(func) {
				return c.add(null, func);
			});
		});
		_lastMediaTime = time;
		_dispatch("matchMedia");
	}
};
var Context = /*#__PURE__*/ function() {
	function Context(func, scope) {
		this.selector = scope && selector(scope);
		this.data = [];
		this._r = [];
		this.isReverted = false;
		this.id = _contextID++;
		func && this.add(func);
	}
	var _proto5 = Context.prototype;
	_proto5.add = function add(name, func, scope) {
		if (_isFunction(name)) {
			scope = func;
			func = name;
			name = _isFunction;
		}
		var self = this, f = function f() {
			var prev = _context, prevSelector = self.selector, result;
			prev && prev !== self && prev.data.push(self);
			scope && (self.selector = selector(scope));
			_context = self;
			result = func.apply(self, arguments);
			_isFunction(result) && self._r.push(result);
			_context = prev;
			self.selector = prevSelector;
			self.isReverted = false;
			return result;
		};
		self.last = f;
		return name === _isFunction ? f(self, function(func) {
			return self.add(null, func);
		}) : name ? self[name] = f : f;
	};
	_proto5.ignore = function ignore(func) {
		var prev = _context;
		_context = null;
		func(this);
		_context = prev;
	};
	_proto5.getTweens = function getTweens() {
		var a = [];
		this.data.forEach(function(e) {
			return e instanceof Context ? a.push.apply(a, e.getTweens()) : e instanceof Tween && !(e.parent && e.parent.data === "nested") && a.push(e);
		});
		return a;
	};
	_proto5.clear = function clear() {
		this._r.length = this.data.length = 0;
	};
	_proto5.kill = function kill(revert, matchMedia) {
		var _this4 = this;
		if (revert) (function() {
			var tweens = _this4.getTweens(), i = _this4.data.length, t;
			while (i--) {
				t = _this4.data[i];
				if (t.data === "isFlip") {
					t.revert();
					t.getChildren(true, true, false).forEach(function(tween) {
						return tweens.splice(tweens.indexOf(tween), 1);
					});
				}
			}
			tweens.map(function(t) {
				return {
					g: t._dur || t._delay || t._sat && !t._sat.vars.immediateRender ? t.globalTime(0) : -Infinity,
					t
				};
			}).sort(function(a, b) {
				return b.g - a.g || -Infinity;
			}).forEach(function(o) {
				return o.t.revert(revert);
			});
			i = _this4.data.length;
			while (i--) {
				t = _this4.data[i];
				if (t instanceof Timeline) {
					if (t.data !== "nested") {
						t.scrollTrigger && t.scrollTrigger.revert();
						t.kill();
					}
				} else !(t instanceof Tween) && t.revert && t.revert(revert);
			}
			_this4._r.forEach(function(f) {
				return f(revert, _this4);
			});
			_this4.isReverted = true;
		})();
		else this.data.forEach(function(e) {
			return e.kill && e.kill();
		});
		this.clear();
		if (matchMedia) {
			var i = _media.length;
			while (i--) _media[i].id === this.id && _media.splice(i, 1);
		}
	};
	_proto5.revert = function revert(config) {
		this.kill(config || {});
	};
	return Context;
}();
var MatchMedia = /*#__PURE__*/ function() {
	function MatchMedia(scope) {
		this.contexts = [];
		this.scope = scope;
		_context && _context.data.push(this);
	}
	var _proto6 = MatchMedia.prototype;
	_proto6.add = function add(conditions, func, scope) {
		_isObject(conditions) || (conditions = { matches: conditions });
		var context = new Context(0, scope || this.scope), cond = context.conditions = {}, mq, p, active;
		_context && !context.selector && (context.selector = _context.selector);
		this.contexts.push(context);
		func = context.add("onMatch", func);
		context.queries = conditions;
		for (p in conditions) if (p === "all") active = 1;
		else {
			mq = _win$1.matchMedia(conditions[p]);
			if (mq) {
				_media.indexOf(context) < 0 && _media.push(context);
				(cond[p] = mq.matches) && (active = 1);
				mq.addListener ? mq.addListener(_onMediaChange) : mq.addEventListener("change", _onMediaChange);
			}
		}
		active && func(context, function(f) {
			return context.add(null, f);
		});
		return this;
	};
	_proto6.revert = function revert(config) {
		this.kill(config || {});
	};
	_proto6.kill = function kill(revert) {
		this.contexts.forEach(function(c) {
			return c.kill(revert, true);
		});
	};
	return MatchMedia;
}();
var _gsap = {
	registerPlugin: function registerPlugin() {
		for (var _len2 = arguments.length, args = new Array(_len2), _key2 = 0; _key2 < _len2; _key2++) args[_key2] = arguments[_key2];
		args.forEach(function(config) {
			return _createPlugin(config);
		});
	},
	timeline: function timeline(vars) {
		return new Timeline(vars);
	},
	getTweensOf: function getTweensOf(targets, onlyActive) {
		return _globalTimeline.getTweensOf(targets, onlyActive);
	},
	getProperty: function getProperty(target, property, unit, uncache) {
		_isString(target) && (target = toArray(target)[0]);
		var getter = _getCache(target || {}).get, format = unit ? _passThrough : _numericIfPossible;
		unit === "native" && (unit = "");
		return !target ? target : !property ? function(property, unit, uncache) {
			return format((_plugins[property] && _plugins[property].get || getter)(target, property, unit, uncache));
		} : format((_plugins[property] && _plugins[property].get || getter)(target, property, unit, uncache));
	},
	quickSetter: function quickSetter(target, property, unit) {
		target = toArray(target);
		if (target.length > 1) {
			var setters = target.map(function(t) {
				return gsap.quickSetter(t, property, unit);
			}), l = setters.length;
			return function(value) {
				var i = l;
				while (i--) setters[i](value);
			};
		}
		target = target[0] || {};
		var Plugin = _plugins[property], cache = _getCache(target), p = cache.harness && (cache.harness.aliases || {})[property] || property, setter = Plugin ? function(value) {
			var p = new Plugin();
			_quickTween._pt = 0;
			p.init(target, unit ? value + unit : value, _quickTween, 0, [target]);
			p.render(1, p);
			_quickTween._pt && _renderPropTweens(1, _quickTween);
		} : cache.set(target, p);
		return Plugin ? setter : function(value) {
			return setter(target, p, unit ? value + unit : value, cache, 1);
		};
	},
	quickTo: function quickTo(target, property, vars) {
		var _setDefaults2;
		var tween = gsap.to(target, _setDefaults((_setDefaults2 = {}, _setDefaults2[property] = "+=0.1", _setDefaults2.paused = true, _setDefaults2.stagger = 0, _setDefaults2), vars || {})), func = function func(value, start, startIsRelative) {
			return tween.resetTo(property, value, start, startIsRelative);
		};
		func.tween = tween;
		return func;
	},
	isTweening: function isTweening(targets) {
		return _globalTimeline.getTweensOf(targets, true).length > 0;
	},
	defaults: function defaults(value) {
		value && value.ease && (value.ease = _parseEase(value.ease, _defaults.ease));
		return _mergeDeep(_defaults, value || {});
	},
	config: function config(value) {
		return _mergeDeep(_config, value || {});
	},
	registerEffect: function registerEffect(_ref3) {
		var name = _ref3.name, effect = _ref3.effect, plugins = _ref3.plugins, defaults = _ref3.defaults, extendTimeline = _ref3.extendTimeline;
		(plugins || "").split(",").forEach(function(pluginName) {
			return pluginName && !_plugins[pluginName] && !_globals[pluginName] && _warn(name + " effect requires " + pluginName + " plugin.");
		});
		_effects[name] = function(targets, vars, tl) {
			return effect(toArray(targets), _setDefaults(vars || {}, defaults), tl);
		};
		if (extendTimeline) Timeline.prototype[name] = function(targets, vars, position) {
			return this.add(_effects[name](targets, _isObject(vars) ? vars : (position = vars) && {}, this), position);
		};
	},
	registerEase: function registerEase(name, ease) {
		_easeMap[name] = _parseEase(ease);
	},
	parseEase: function parseEase(ease, defaultEase) {
		return arguments.length ? _parseEase(ease, defaultEase) : _easeMap;
	},
	getById: function getById(id) {
		return _globalTimeline.getById(id);
	},
	exportRoot: function exportRoot(vars, includeDelayedCalls) {
		if (vars === void 0) vars = {};
		var tl = new Timeline(vars), child, next;
		tl.smoothChildTiming = _isNotFalse(vars.smoothChildTiming);
		_globalTimeline.remove(tl);
		tl._dp = 0;
		tl._time = tl._tTime = _globalTimeline._time;
		child = _globalTimeline._first;
		while (child) {
			next = child._next;
			if (includeDelayedCalls || !(!child._dur && child instanceof Tween && child.vars.onComplete === child._targets[0])) _addToTimeline(tl, child, child._start - child._delay);
			child = next;
		}
		_addToTimeline(_globalTimeline, tl, 0);
		return tl;
	},
	context: function context(func, scope) {
		return func ? new Context(func, scope) : _context;
	},
	matchMedia: function matchMedia(scope) {
		return new MatchMedia(scope);
	},
	matchMediaRefresh: function matchMediaRefresh() {
		return _media.forEach(function(c) {
			var cond = c.conditions, found, p;
			for (p in cond) if (cond[p]) {
				cond[p] = false;
				found = 1;
			}
			found && c.revert();
		}) || _onMediaChange();
	},
	addEventListener: function addEventListener(type, callback) {
		var a = _listeners[type] || (_listeners[type] = []);
		~a.indexOf(callback) || a.push(callback);
	},
	removeEventListener: function removeEventListener(type, callback) {
		var a = _listeners[type], i = a && a.indexOf(callback);
		i >= 0 && a.splice(i, 1);
	},
	utils: {
		wrap,
		wrapYoyo,
		distribute,
		random,
		snap,
		normalize,
		getUnit,
		clamp,
		splitColor,
		toArray,
		selector,
		mapRange,
		pipe,
		unitize,
		interpolate,
		shuffle
	},
	install: _install,
	effects: _effects,
	ticker: _ticker,
	updateRoot: Timeline.updateRoot,
	plugins: _plugins,
	globalTimeline: _globalTimeline,
	core: {
		PropTween,
		globals: _addGlobal,
		Tween,
		Timeline,
		Animation,
		getCache: _getCache,
		_removeLinkedListItem,
		reverting: function reverting() {
			return _reverting$1;
		},
		context: function context(toAdd) {
			if (toAdd && _context) {
				_context.data.push(toAdd);
				toAdd._ctx = _context;
			}
			return _context;
		},
		suppressOverwrites: function suppressOverwrites(value) {
			return _suppressOverwrites = value;
		}
	}
};
_forEachName("to,from,fromTo,delayedCall,set,killTweensOf", function(name) {
	return _gsap[name] = Tween[name];
});
_ticker.add(Timeline.updateRoot);
_quickTween = _gsap.to({}, { duration: 0 });
var _getPluginPropTween = function _getPluginPropTween(plugin, prop) {
	var pt = plugin._pt;
	while (pt && pt.p !== prop && pt.op !== prop && pt.fp !== prop) pt = pt._next;
	return pt;
};
var _addModifiers = function _addModifiers(tween, modifiers) {
	var targets = tween._targets, p, i, pt;
	for (p in modifiers) {
		i = targets.length;
		while (i--) {
			pt = tween._ptLookup[i][p];
			if (pt && (pt = pt.d)) {
				if (pt._pt) pt = _getPluginPropTween(pt, p);
				pt && pt.modifier && pt.modifier(modifiers[p], tween, targets[i], p);
			}
		}
	}
};
var _buildModifierPlugin = function _buildModifierPlugin(name, modifier) {
	return {
		name,
		headless: 1,
		rawVars: 1,
		init: function init(target, vars, tween) {
			tween._onInit = function(tween) {
				var temp, p;
				if (_isString(vars)) {
					temp = {};
					_forEachName(vars, function(name) {
						return temp[name] = 1;
					});
					vars = temp;
				}
				if (modifier) {
					temp = {};
					for (p in vars) temp[p] = modifier(vars[p]);
					vars = temp;
				}
				_addModifiers(tween, vars);
			};
		}
	};
};
var gsap = _gsap.registerPlugin({
	name: "attr",
	init: function init(target, vars, tween, index, targets) {
		var p, pt, v;
		this.tween = tween;
		for (p in vars) {
			v = target.getAttribute(p) || "";
			pt = this.add(target, "setAttribute", (v || 0) + "", vars[p], index, targets, 0, 0, p);
			pt.op = p;
			pt.b = v;
			this._props.push(p);
		}
	},
	render: function render(ratio, data) {
		var pt = data._pt;
		while (pt) {
			_reverting$1 ? pt.set(pt.t, pt.p, pt.b, pt) : pt.r(ratio, pt.d);
			pt = pt._next;
		}
	}
}, {
	name: "endArray",
	headless: 1,
	init: function init(target, value) {
		var i = value.length;
		while (i--) this.add(target, i, target[i] || 0, value[i], 0, 0, 0, 0, 0, 1);
	}
}, _buildModifierPlugin("roundProps", _roundModifier), _buildModifierPlugin("modifiers"), _buildModifierPlugin("snap", snap)) || _gsap;
Tween.version = Timeline.version = gsap.version = "3.15.0";
_coreReady = 1;
_windowExists$1() && _wake();
_easeMap.Power0;
_easeMap.Power1;
_easeMap.Power2;
_easeMap.Power3;
_easeMap.Power4;
_easeMap.Linear;
_easeMap.Quad;
_easeMap.Cubic;
_easeMap.Quart;
_easeMap.Quint;
_easeMap.Strong;
_easeMap.Elastic;
_easeMap.Back;
_easeMap.SteppedEase;
_easeMap.Bounce;
_easeMap.Sine;
_easeMap.Expo;
_easeMap.Circ;
//#endregion
//#region ../celestial-frontier-anthropic-mac/port/v2/node_modules/gsap/CSSPlugin.js
/*!
* CSSPlugin 3.15.0
* https://gsap.com
*
* Copyright 2008-2026, GreenSock. All rights reserved.
* Subject to the terms at https://gsap.com/standard-license
* @author: Jack Doyle, jack@greensock.com
*/
var _win;
var _doc;
var _docElement;
var _pluginInitted;
var _tempDiv;
var _recentSetterPlugin;
var _reverting;
var _windowExists = function _windowExists() {
	return typeof window !== "undefined";
};
var _transformProps = {};
var _RAD2DEG = 180 / Math.PI;
var _DEG2RAD = Math.PI / 180;
var _atan2 = Math.atan2;
var _bigNum = 1e8;
var _capsExp = /([A-Z])/g;
var _horizontalExp = /(left|right|width|margin|padding|x)/i;
var _complexExp = /[\s,\(]\S/;
var _propertyAliases = {
	autoAlpha: "opacity,visibility",
	scale: "scaleX,scaleY",
	alpha: "opacity"
};
var _renderCSSProp = function _renderCSSProp(ratio, data) {
	return data.set(data.t, data.p, Math.round((data.s + data.c * ratio) * 1e4) / 1e4 + data.u, data);
};
var _renderPropWithEnd = function _renderPropWithEnd(ratio, data) {
	return data.set(data.t, data.p, ratio === 1 ? data.e : Math.round((data.s + data.c * ratio) * 1e4) / 1e4 + data.u, data);
};
var _renderCSSPropWithBeginning = function _renderCSSPropWithBeginning(ratio, data) {
	return data.set(data.t, data.p, ratio ? Math.round((data.s + data.c * ratio) * 1e4) / 1e4 + data.u : data.b, data);
};
var _renderCSSPropWithBeginningAndEnd = function _renderCSSPropWithBeginningAndEnd(ratio, data) {
	return data.set(data.t, data.p, ratio === 1 ? data.e : ratio ? Math.round((data.s + data.c * ratio) * 1e4) / 1e4 + data.u : data.b, data);
};
var _renderRoundedCSSProp = function _renderRoundedCSSProp(ratio, data) {
	var value = data.s + data.c * ratio;
	data.set(data.t, data.p, ~~(value + (value < 0 ? -.5 : .5)) + data.u, data);
};
var _renderNonTweeningValue = function _renderNonTweeningValue(ratio, data) {
	return data.set(data.t, data.p, ratio ? data.e : data.b, data);
};
var _renderNonTweeningValueOnlyAtEnd = function _renderNonTweeningValueOnlyAtEnd(ratio, data) {
	return data.set(data.t, data.p, ratio !== 1 ? data.b : data.e, data);
};
var _setterCSSStyle = function _setterCSSStyle(target, property, value) {
	return target.style[property] = value;
};
var _setterCSSProp = function _setterCSSProp(target, property, value) {
	return target.style.setProperty(property, value);
};
var _setterTransform = function _setterTransform(target, property, value) {
	return target._gsap[property] = value;
};
var _setterScale = function _setterScale(target, property, value) {
	return target._gsap.scaleX = target._gsap.scaleY = value;
};
var _setterScaleWithRender = function _setterScaleWithRender(target, property, value, data, ratio) {
	var cache = target._gsap;
	cache.scaleX = cache.scaleY = value;
	cache.renderTransform(ratio, cache);
};
var _setterTransformWithRender = function _setterTransformWithRender(target, property, value, data, ratio) {
	var cache = target._gsap;
	cache[property] = value;
	cache.renderTransform(ratio, cache);
};
var _transformProp = "transform";
var _transformOriginProp = _transformProp + "Origin";
var _saveStyle = function _saveStyle(property, isNotCSS) {
	var _this = this;
	var target = this.target, style = target.style, cache = target._gsap;
	if (property in _transformProps && style) {
		this.tfm = this.tfm || {};
		if (property !== "transform") {
			property = _propertyAliases[property] || property;
			~property.indexOf(",") ? property.split(",").forEach(function(a) {
				return _this.tfm[a] = _get(target, a);
			}) : this.tfm[property] = cache.x ? cache[property] : _get(target, property);
			property === _transformOriginProp && (this.tfm.zOrigin = cache.zOrigin);
		} else return _propertyAliases.transform.split(",").forEach(function(p) {
			return _saveStyle.call(_this, p, isNotCSS);
		});
		if (this.props.indexOf(_transformProp) >= 0) return;
		if (cache.svg) {
			this.svgo = target.getAttribute("data-svg-origin");
			this.props.push(_transformOriginProp, isNotCSS, "");
		}
		property = _transformProp;
	}
	(style || isNotCSS) && this.props.push(property, isNotCSS, style[property]);
};
var _removeIndependentTransforms = function _removeIndependentTransforms(style) {
	if (style.translate) {
		style.removeProperty("translate");
		style.removeProperty("scale");
		style.removeProperty("rotate");
	}
};
var _revertStyle = function _revertStyle() {
	var props = this.props, target = this.target, style = target.style, cache = target._gsap, i, p;
	for (i = 0; i < props.length; i += 3) if (!props[i + 1]) props[i + 2] ? style[props[i]] = props[i + 2] : style.removeProperty(props[i].substr(0, 2) === "--" ? props[i] : props[i].replace(_capsExp, "-$1").toLowerCase());
	else if (props[i + 1] === 2) target[props[i]](props[i + 2]);
	else target[props[i]] = props[i + 2];
	if (this.tfm) {
		for (p in this.tfm) cache[p] = this.tfm[p];
		if (cache.svg) {
			cache.renderTransform();
			target.setAttribute("data-svg-origin", this.svgo || "");
		}
		i = _reverting();
		if ((!i || !i.isStart) && !style[_transformProp]) {
			_removeIndependentTransforms(style);
			if (cache.zOrigin && style[_transformOriginProp]) {
				style[_transformOriginProp] += " " + cache.zOrigin + "px";
				cache.zOrigin = 0;
				cache.renderTransform();
			}
			cache.uncache = 1;
		}
	}
};
var _getStyleSaver = function _getStyleSaver(target, properties) {
	var saver = {
		target,
		props: [],
		revert: _revertStyle,
		save: _saveStyle
	};
	target._gsap || gsap.core.getCache(target);
	properties && target.style && target.nodeType && properties.split(",").forEach(function(p) {
		return saver.save(p);
	});
	return saver;
};
var _supports3D;
var _createElement = function _createElement(type, ns) {
	var e = _doc.createElementNS ? _doc.createElementNS((ns || "http://www.w3.org/1999/xhtml").replace(/^https/, "http"), type) : _doc.createElement(type);
	return e && e.style ? e : _doc.createElement(type);
};
var _getComputedProperty = function _getComputedProperty(target, property, skipPrefixFallback) {
	var cs = getComputedStyle(target);
	return cs[property] || cs.getPropertyValue(property.replace(_capsExp, "-$1").toLowerCase()) || cs.getPropertyValue(property) || !skipPrefixFallback && _getComputedProperty(target, _checkPropPrefix(property) || property, 1) || "";
};
var _prefixes = "O,Moz,ms,Ms,Webkit".split(",");
var _checkPropPrefix = function _checkPropPrefix(property, element, preferPrefix) {
	var s = (element || _tempDiv).style, i = 5;
	if (property in s && !preferPrefix) return property;
	property = property.charAt(0).toUpperCase() + property.substr(1);
	while (i-- && !(_prefixes[i] + property in s));
	return i < 0 ? null : (i === 3 ? "ms" : i >= 0 ? _prefixes[i] : "") + property;
};
var _initCore = function _initCore() {
	if (_windowExists() && window.document) {
		_win = window;
		_doc = _win.document;
		_docElement = _doc.documentElement;
		_tempDiv = _createElement("div") || { style: {} };
		_createElement("div");
		_transformProp = _checkPropPrefix(_transformProp);
		_transformOriginProp = _transformProp + "Origin";
		_tempDiv.style.cssText = "border-width:0;line-height:0;position:absolute;padding:0";
		_supports3D = !!_checkPropPrefix("perspective");
		_reverting = gsap.core.reverting;
		_pluginInitted = 1;
	}
};
var _getReparentedCloneBBox = function _getReparentedCloneBBox(target) {
	var owner = target.ownerSVGElement, svg = _createElement("svg", owner && owner.getAttribute("xmlns") || "http://www.w3.org/2000/svg"), clone = target.cloneNode(true), bbox;
	clone.style.display = "block";
	svg.appendChild(clone);
	_docElement.appendChild(svg);
	try {
		bbox = clone.getBBox();
	} catch (e) {}
	svg.removeChild(clone);
	_docElement.removeChild(svg);
	return bbox;
};
var _getAttributeFallbacks = function _getAttributeFallbacks(target, attributesArray) {
	var i = attributesArray.length;
	while (i--) if (target.hasAttribute(attributesArray[i])) return target.getAttribute(attributesArray[i]);
};
var _getBBox = function _getBBox(target) {
	var bounds, cloned;
	try {
		bounds = target.getBBox();
	} catch (error) {
		bounds = _getReparentedCloneBBox(target);
		cloned = 1;
	}
	bounds && (bounds.width || bounds.height) || cloned || (bounds = _getReparentedCloneBBox(target));
	return bounds && !bounds.width && !bounds.x && !bounds.y ? {
		x: +_getAttributeFallbacks(target, [
			"x",
			"cx",
			"x1"
		]) || 0,
		y: +_getAttributeFallbacks(target, [
			"y",
			"cy",
			"y1"
		]) || 0,
		width: 0,
		height: 0
	} : bounds;
};
var _isSVG = function _isSVG(e) {
	return !!(e.getCTM && (!e.parentNode || e.ownerSVGElement) && _getBBox(e));
};
var _removeProperty = function _removeProperty(target, property) {
	if (property) {
		var style = target.style, first2Chars;
		if (property in _transformProps && property !== _transformOriginProp) property = _transformProp;
		if (style.removeProperty) {
			first2Chars = property.substr(0, 2);
			if (first2Chars === "ms" || property.substr(0, 6) === "webkit") property = "-" + property;
			style.removeProperty(first2Chars === "--" ? property : property.replace(_capsExp, "-$1").toLowerCase());
		} else style.removeAttribute(property);
	}
};
var _addNonTweeningPT = function _addNonTweeningPT(plugin, target, property, beginning, end, onlySetAtEnd) {
	var pt = new PropTween(plugin._pt, target, property, 0, 1, onlySetAtEnd ? _renderNonTweeningValueOnlyAtEnd : _renderNonTweeningValue);
	plugin._pt = pt;
	pt.b = beginning;
	pt.e = end;
	plugin._props.push(property);
	return pt;
};
var _nonConvertibleUnits = {
	deg: 1,
	rad: 1,
	turn: 1
};
var _nonStandardLayouts = {
	grid: 1,
	flex: 1
};
var _convertToUnit = function _convertToUnit(target, property, value, unit) {
	var curValue = parseFloat(value) || 0, curUnit = (value + "").trim().substr((curValue + "").length) || "px", style = _tempDiv.style, horizontal = _horizontalExp.test(property), isRootSVG = target.tagName.toLowerCase() === "svg", measureProperty = (isRootSVG ? "client" : "offset") + (horizontal ? "Width" : "Height"), amount = 100, toPixels = unit === "px", toPercent = unit === "%", px, parent, cache, isSVG;
	if (unit === curUnit || !curValue || _nonConvertibleUnits[unit] || _nonConvertibleUnits[curUnit]) return curValue;
	curUnit !== "px" && !toPixels && (curValue = _convertToUnit(target, property, value, "px"));
	isSVG = target.getCTM && _isSVG(target);
	if ((toPercent || curUnit === "%") && (_transformProps[property] || ~property.indexOf("adius"))) {
		px = isSVG ? target.getBBox()[horizontal ? "width" : "height"] : target[measureProperty];
		return _round(toPercent ? curValue / px * amount : curValue / 100 * px);
	}
	style[horizontal ? "width" : "height"] = amount + (toPixels ? curUnit : unit);
	parent = unit !== "rem" && ~property.indexOf("adius") || unit === "em" && target.appendChild && !isRootSVG ? target : target.parentNode;
	if (isSVG) parent = (target.ownerSVGElement || {}).parentNode;
	if (!parent || parent === _doc || !parent.appendChild) parent = _doc.body;
	cache = parent._gsap;
	if (cache && toPercent && cache.width && horizontal && cache.time === _ticker.time && !cache.uncache) return _round(curValue / cache.width * amount);
	else {
		if (toPercent && (property === "height" || property === "width")) {
			var v = target.style[property];
			target.style[property] = amount + unit;
			px = target[measureProperty];
			v ? target.style[property] = v : _removeProperty(target, property);
		} else {
			(toPercent || curUnit === "%") && !_nonStandardLayouts[_getComputedProperty(parent, "display")] && (style.position = _getComputedProperty(target, "position"));
			parent === target && (style.position = "static");
			parent.appendChild(_tempDiv);
			px = _tempDiv[measureProperty];
			parent.removeChild(_tempDiv);
			style.position = "absolute";
		}
		if (horizontal && toPercent) {
			cache = _getCache(parent);
			cache.time = _ticker.time;
			cache.width = parent[measureProperty];
		}
	}
	return _round(toPixels ? px * curValue / amount : px && curValue ? amount / px * curValue : 0);
};
var _get = function _get(target, property, unit, uncache) {
	var value;
	_pluginInitted || _initCore();
	if (property in _propertyAliases && property !== "transform") {
		property = _propertyAliases[property];
		if (~property.indexOf(",")) property = property.split(",")[0];
	}
	if (_transformProps[property] && property !== "transform") {
		value = _parseTransform(target, uncache);
		value = property !== "transformOrigin" ? value[property] : value.svg ? value.origin : _firstTwoOnly(_getComputedProperty(target, _transformOriginProp)) + " " + value.zOrigin + "px";
	} else {
		value = target.style[property];
		if (!value || value === "auto" || uncache || ~(value + "").indexOf("calc(")) value = _specialProps[property] && _specialProps[property](target, property, unit) || _getComputedProperty(target, property) || _getProperty(target, property) || (property === "opacity" ? 1 : 0);
	}
	return unit && !~(value + "").trim().indexOf(" ") ? _convertToUnit(target, property, value, unit) + unit : value;
};
var _tweenComplexCSSString = function _tweenComplexCSSString(target, prop, start, end) {
	if (!start || start === "none") {
		var p = _checkPropPrefix(prop, target, 1), s = p && _getComputedProperty(target, p, 1);
		if (s && s !== start) {
			prop = p;
			start = s;
		} else if (prop === "borderColor") start = _getComputedProperty(target, "borderTopColor");
	}
	var pt = new PropTween(this._pt, target.style, prop, 0, 1, _renderComplexString), index = 0, matchIndex = 0, a, result, startValues, startNum, color, startValue, endValue, endNum, chunk, endUnit, startUnit, endValues;
	pt.b = start;
	pt.e = end;
	start += "";
	end += "";
	if (end.substring(0, 6) === "var(--") end = _getComputedProperty(target, end.substring(4, end.indexOf(")")));
	if (end === "auto") {
		startValue = target.style[prop];
		target.style[prop] = end;
		end = _getComputedProperty(target, prop) || end;
		startValue ? target.style[prop] = startValue : _removeProperty(target, prop);
	}
	a = [start, end];
	_colorStringFilter(a);
	start = a[0];
	end = a[1];
	startValues = start.match(_numWithUnitExp) || [];
	endValues = end.match(_numWithUnitExp) || [];
	if (endValues.length) {
		while (result = _numWithUnitExp.exec(end)) {
			endValue = result[0];
			chunk = end.substring(index, result.index);
			if (color) color = (color + 1) % 5;
			else if (chunk.substr(-5) === "rgba(" || chunk.substr(-5) === "hsla(") color = 1;
			if (endValue !== (startValue = startValues[matchIndex++] || "")) {
				startNum = parseFloat(startValue) || 0;
				startUnit = startValue.substr((startNum + "").length);
				endValue.charAt(1) === "=" && (endValue = _parseRelative(startNum, endValue) + startUnit);
				endNum = parseFloat(endValue);
				endUnit = endValue.substr((endNum + "").length);
				index = _numWithUnitExp.lastIndex - endUnit.length;
				if (!endUnit) {
					endUnit = endUnit || _config.units[prop] || startUnit;
					if (index === end.length) {
						end += endUnit;
						pt.e += endUnit;
					}
				}
				if (startUnit !== endUnit) startNum = _convertToUnit(target, prop, startValue, endUnit) || 0;
				pt._pt = {
					_next: pt._pt,
					p: chunk || matchIndex === 1 ? chunk : ",",
					s: startNum,
					c: endNum - startNum,
					m: color && color < 4 || prop === "zIndex" ? Math.round : 0
				};
			}
		}
		pt.c = index < end.length ? end.substring(index, end.length) : "";
	} else pt.r = prop === "display" && end === "none" ? _renderNonTweeningValueOnlyAtEnd : _renderNonTweeningValue;
	_relExp.test(end) && (pt.e = 0);
	this._pt = pt;
	return pt;
};
var _keywordToPercent = {
	top: "0%",
	bottom: "100%",
	left: "0%",
	right: "100%",
	center: "50%"
};
var _convertKeywordsToPercentages = function _convertKeywordsToPercentages(value) {
	var split = value.split(" "), x = split[0], y = split[1] || "50%";
	if (x === "top" || x === "bottom" || y === "left" || y === "right") {
		value = x;
		x = y;
		y = value;
	}
	split[0] = _keywordToPercent[x] || x;
	split[1] = _keywordToPercent[y] || y;
	return split.join(" ");
};
var _renderClearProps = function _renderClearProps(ratio, data) {
	if (data.tween && data.tween._time === data.tween._dur) {
		var target = data.t, style = target.style, props = data.u, cache = target._gsap, prop, clearTransforms, i;
		if (props === "all" || props === true) {
			style.cssText = "";
			clearTransforms = 1;
		} else {
			props = props.split(",");
			i = props.length;
			while (--i > -1) {
				prop = props[i];
				if (_transformProps[prop]) {
					clearTransforms = 1;
					prop = prop === "transformOrigin" ? _transformOriginProp : _transformProp;
				}
				_removeProperty(target, prop);
			}
		}
		if (clearTransforms) {
			_removeProperty(target, _transformProp);
			if (cache) {
				cache.svg && target.removeAttribute("transform");
				style.scale = style.rotate = style.translate = "none";
				_parseTransform(target, 1);
				cache.uncache = 1;
				_removeIndependentTransforms(style);
			}
		}
	}
};
var _specialProps = { clearProps: function clearProps(plugin, target, property, endValue, tween) {
	if (tween.data !== "isFromStart") {
		var pt = plugin._pt = new PropTween(plugin._pt, target, property, 0, 0, _renderClearProps);
		pt.u = endValue;
		pt.pr = -10;
		pt.tween = tween;
		plugin._props.push(property);
		return 1;
	}
} };
var _identity2DMatrix = [
	1,
	0,
	0,
	1,
	0,
	0
];
var _rotationalProperties = {};
var _isNullTransform = function _isNullTransform(value) {
	return value === "matrix(1, 0, 0, 1, 0, 0)" || value === "none" || !value;
};
var _getComputedTransformMatrixAsArray = function _getComputedTransformMatrixAsArray(target) {
	var matrixString = _getComputedProperty(target, _transformProp);
	return _isNullTransform(matrixString) ? _identity2DMatrix : matrixString.substr(7).match(_numExp).map(_round);
};
var _getMatrix = function _getMatrix(target, force2D) {
	var cache = target._gsap || _getCache(target), style = target.style, matrix = _getComputedTransformMatrixAsArray(target), parent, nextSibling, temp, addedToDOM;
	if (cache.svg && target.getAttribute("transform")) {
		temp = target.transform.baseVal.consolidate().matrix;
		matrix = [
			temp.a,
			temp.b,
			temp.c,
			temp.d,
			temp.e,
			temp.f
		];
		return matrix.join(",") === "1,0,0,1,0,0" ? _identity2DMatrix : matrix;
	} else if (matrix === _identity2DMatrix && !target.offsetParent && target !== _docElement && !cache.svg) {
		temp = style.display;
		style.display = "block";
		parent = target.parentNode;
		if (!parent || !target.offsetParent && !target.getBoundingClientRect().width) {
			addedToDOM = 1;
			nextSibling = target.nextElementSibling;
			_docElement.appendChild(target);
		}
		matrix = _getComputedTransformMatrixAsArray(target);
		temp ? style.display = temp : _removeProperty(target, "display");
		if (addedToDOM) nextSibling ? parent.insertBefore(target, nextSibling) : parent ? parent.appendChild(target) : _docElement.removeChild(target);
	}
	return force2D && matrix.length > 6 ? [
		matrix[0],
		matrix[1],
		matrix[4],
		matrix[5],
		matrix[12],
		matrix[13]
	] : matrix;
};
var _applySVGOrigin = function _applySVGOrigin(target, origin, originIsAbsolute, smooth, matrixArray, pluginToAddPropTweensTo) {
	var cache = target._gsap, matrix = matrixArray || _getMatrix(target, true), xOriginOld = cache.xOrigin || 0, yOriginOld = cache.yOrigin || 0, xOffsetOld = cache.xOffset || 0, yOffsetOld = cache.yOffset || 0, a = matrix[0], b = matrix[1], c = matrix[2], d = matrix[3], tx = matrix[4], ty = matrix[5], originSplit = origin.split(" "), xOrigin = parseFloat(originSplit[0]) || 0, yOrigin = parseFloat(originSplit[1]) || 0, bounds, determinant, x, y;
	if (!originIsAbsolute) {
		bounds = _getBBox(target);
		xOrigin = bounds.x + (~originSplit[0].indexOf("%") ? xOrigin / 100 * bounds.width : xOrigin);
		yOrigin = bounds.y + (~(originSplit[1] || originSplit[0]).indexOf("%") ? yOrigin / 100 * bounds.height : yOrigin);
	} else if (matrix !== _identity2DMatrix && (determinant = a * d - b * c)) {
		x = xOrigin * (d / determinant) + yOrigin * (-c / determinant) + (c * ty - d * tx) / determinant;
		y = xOrigin * (-b / determinant) + yOrigin * (a / determinant) - (a * ty - b * tx) / determinant;
		xOrigin = x;
		yOrigin = y;
	}
	if (smooth || smooth !== false && cache.smooth) {
		tx = xOrigin - xOriginOld;
		ty = yOrigin - yOriginOld;
		cache.xOffset = xOffsetOld + (tx * a + ty * c) - tx;
		cache.yOffset = yOffsetOld + (tx * b + ty * d) - ty;
	} else cache.xOffset = cache.yOffset = 0;
	cache.xOrigin = xOrigin;
	cache.yOrigin = yOrigin;
	cache.smooth = !!smooth;
	cache.origin = origin;
	cache.originIsAbsolute = !!originIsAbsolute;
	target.style[_transformOriginProp] = "0px 0px";
	if (pluginToAddPropTweensTo) {
		_addNonTweeningPT(pluginToAddPropTweensTo, cache, "xOrigin", xOriginOld, xOrigin);
		_addNonTweeningPT(pluginToAddPropTweensTo, cache, "yOrigin", yOriginOld, yOrigin);
		_addNonTweeningPT(pluginToAddPropTweensTo, cache, "xOffset", xOffsetOld, cache.xOffset);
		_addNonTweeningPT(pluginToAddPropTweensTo, cache, "yOffset", yOffsetOld, cache.yOffset);
	}
	target.setAttribute("data-svg-origin", xOrigin + " " + yOrigin);
};
var _parseTransform = function _parseTransform(target, uncache) {
	var cache = target._gsap || new GSCache(target);
	if ("x" in cache && !uncache && !cache.uncache) return cache;
	var style = target.style, invertedScaleX = cache.scaleX < 0, px = "px", deg = "deg", cs = getComputedStyle(target), origin = _getComputedProperty(target, _transformOriginProp) || "0", x = y = z = rotation = rotationX = rotationY = skewX = skewY = perspective = 0, y, z, scaleX = scaleY = 1, scaleY, rotation, rotationX, rotationY, skewX, skewY, perspective, xOrigin, yOrigin, matrix, angle, cos, sin, a, b, c, d, a12, a22, t1, t2, t3, a13, a23, a33, a42, a43, a32;
	cache.svg = !!(target.getCTM && _isSVG(target));
	if (cs.translate) {
		if (cs.translate !== "none" || cs.scale !== "none" || cs.rotate !== "none") style[_transformProp] = (cs.translate !== "none" ? "translate3d(" + (cs.translate + " 0 0").split(" ").slice(0, 3).join(", ") + ") " : "") + (cs.rotate !== "none" ? "rotate(" + cs.rotate + ") " : "") + (cs.scale !== "none" ? "scale(" + cs.scale.split(" ").join(",") + ") " : "") + (cs[_transformProp] !== "none" ? cs[_transformProp] : "");
		style.scale = style.rotate = style.translate = "none";
	}
	matrix = _getMatrix(target, cache.svg);
	if (cache.svg) {
		if (cache.uncache) {
			t2 = target.getBBox();
			origin = cache.xOrigin - t2.x + "px " + (cache.yOrigin - t2.y) + "px";
			t1 = "";
		} else t1 = !uncache && target.getAttribute("data-svg-origin");
		_applySVGOrigin(target, t1 || origin, !!t1 || cache.originIsAbsolute, cache.smooth !== false, matrix);
	}
	xOrigin = cache.xOrigin || 0;
	yOrigin = cache.yOrigin || 0;
	if (matrix !== _identity2DMatrix) {
		a = matrix[0];
		b = matrix[1];
		c = matrix[2];
		d = matrix[3];
		x = a12 = matrix[4];
		y = a22 = matrix[5];
		if (matrix.length === 6) {
			scaleX = Math.sqrt(a * a + b * b);
			scaleY = Math.sqrt(d * d + c * c);
			rotation = a || b ? _atan2(b, a) * _RAD2DEG : 0;
			skewX = c || d ? _atan2(c, d) * _RAD2DEG + rotation : 0;
			skewX && (scaleY *= Math.abs(Math.cos(skewX * _DEG2RAD)));
			if (cache.svg) {
				x -= xOrigin - (xOrigin * a + yOrigin * c);
				y -= yOrigin - (xOrigin * b + yOrigin * d);
			}
		} else {
			a32 = matrix[6];
			a42 = matrix[7];
			a13 = matrix[8];
			a23 = matrix[9];
			a33 = matrix[10];
			a43 = matrix[11];
			x = matrix[12];
			y = matrix[13];
			z = matrix[14];
			angle = _atan2(a32, a33);
			rotationX = angle * _RAD2DEG;
			if (angle) {
				cos = Math.cos(-angle);
				sin = Math.sin(-angle);
				t1 = a12 * cos + a13 * sin;
				t2 = a22 * cos + a23 * sin;
				t3 = a32 * cos + a33 * sin;
				a13 = a12 * -sin + a13 * cos;
				a23 = a22 * -sin + a23 * cos;
				a33 = a32 * -sin + a33 * cos;
				a43 = a42 * -sin + a43 * cos;
				a12 = t1;
				a22 = t2;
				a32 = t3;
			}
			angle = _atan2(-c, a33);
			rotationY = angle * _RAD2DEG;
			if (angle) {
				cos = Math.cos(-angle);
				sin = Math.sin(-angle);
				t1 = a * cos - a13 * sin;
				t2 = b * cos - a23 * sin;
				t3 = c * cos - a33 * sin;
				a43 = d * sin + a43 * cos;
				a = t1;
				b = t2;
				c = t3;
			}
			angle = _atan2(b, a);
			rotation = angle * _RAD2DEG;
			if (angle) {
				cos = Math.cos(angle);
				sin = Math.sin(angle);
				t1 = a * cos + b * sin;
				t2 = a12 * cos + a22 * sin;
				b = b * cos - a * sin;
				a22 = a22 * cos - a12 * sin;
				a = t1;
				a12 = t2;
			}
			if (rotationX && Math.abs(rotationX) + Math.abs(rotation) > 359.9) {
				rotationX = rotation = 0;
				rotationY = 180 - rotationY;
			}
			scaleX = _round(Math.sqrt(a * a + b * b + c * c));
			scaleY = _round(Math.sqrt(a22 * a22 + a32 * a32));
			angle = _atan2(a12, a22);
			skewX = Math.abs(angle) > 2e-4 ? angle * _RAD2DEG : 0;
			perspective = a43 ? 1 / (a43 < 0 ? -a43 : a43) : 0;
		}
		if (cache.svg) {
			t1 = target.getAttribute("transform");
			cache.forceCSS = target.setAttribute("transform", "") || !_isNullTransform(_getComputedProperty(target, _transformProp));
			t1 && target.setAttribute("transform", t1);
		}
	}
	if (Math.abs(skewX) > 90 && Math.abs(skewX) < 270) if (invertedScaleX) {
		scaleX *= -1;
		skewX += rotation <= 0 ? 180 : -180;
		rotation += rotation <= 0 ? 180 : -180;
	} else {
		scaleY *= -1;
		skewX += skewX <= 0 ? 180 : -180;
	}
	uncache = uncache || cache.uncache;
	cache.x = x - ((cache.xPercent = x && (!uncache && cache.xPercent || (Math.round(target.offsetWidth / 2) === Math.round(-x) ? -50 : 0))) ? target.offsetWidth * cache.xPercent / 100 : 0) + px;
	cache.y = y - ((cache.yPercent = y && (!uncache && cache.yPercent || (Math.round(target.offsetHeight / 2) === Math.round(-y) ? -50 : 0))) ? target.offsetHeight * cache.yPercent / 100 : 0) + px;
	cache.z = z + px;
	cache.scaleX = _round(scaleX);
	cache.scaleY = _round(scaleY);
	cache.rotation = _round(rotation) + deg;
	cache.rotationX = _round(rotationX) + deg;
	cache.rotationY = _round(rotationY) + deg;
	cache.skewX = skewX + deg;
	cache.skewY = skewY + deg;
	cache.transformPerspective = perspective + px;
	if (cache.zOrigin = parseFloat(origin.split(" ")[2]) || !uncache && cache.zOrigin || 0) style[_transformOriginProp] = _firstTwoOnly(origin);
	cache.xOffset = cache.yOffset = 0;
	cache.force3D = _config.force3D;
	cache.renderTransform = cache.svg ? _renderSVGTransforms : _supports3D ? _renderCSSTransforms : _renderNon3DTransforms;
	cache.uncache = 0;
	return cache;
};
var _firstTwoOnly = function _firstTwoOnly(value) {
	return (value = value.split(" "))[0] + " " + value[1];
};
var _addPxTranslate = function _addPxTranslate(target, start, value) {
	var unit = getUnit(start);
	return _round(parseFloat(start) + parseFloat(_convertToUnit(target, "x", value + "px", unit))) + unit;
};
var _renderNon3DTransforms = function _renderNon3DTransforms(ratio, cache) {
	cache.z = "0px";
	cache.rotationY = cache.rotationX = "0deg";
	cache.force3D = 0;
	_renderCSSTransforms(ratio, cache);
};
var _zeroDeg = "0deg";
var _zeroPx = "0px";
var _endParenthesis = ") ";
var _renderCSSTransforms = function _renderCSSTransforms(ratio, cache) {
	var _ref = cache || this, xPercent = _ref.xPercent, yPercent = _ref.yPercent, x = _ref.x, y = _ref.y, z = _ref.z, rotation = _ref.rotation, rotationY = _ref.rotationY, rotationX = _ref.rotationX, skewX = _ref.skewX, skewY = _ref.skewY, scaleX = _ref.scaleX, scaleY = _ref.scaleY, transformPerspective = _ref.transformPerspective, force3D = _ref.force3D, target = _ref.target, zOrigin = _ref.zOrigin, transforms = "", use3D = force3D === "auto" && ratio && ratio !== 1 || force3D === true;
	if (zOrigin && (rotationX !== _zeroDeg || rotationY !== _zeroDeg)) {
		var angle = parseFloat(rotationY) * _DEG2RAD, a13 = Math.sin(angle), a33 = Math.cos(angle), cos;
		angle = parseFloat(rotationX) * _DEG2RAD;
		cos = Math.cos(angle);
		x = _addPxTranslate(target, x, a13 * cos * -zOrigin);
		y = _addPxTranslate(target, y, -Math.sin(angle) * -zOrigin);
		z = _addPxTranslate(target, z, a33 * cos * -zOrigin + zOrigin);
	}
	if (transformPerspective !== _zeroPx) transforms += "perspective(" + transformPerspective + _endParenthesis;
	if (xPercent || yPercent) transforms += "translate(" + xPercent + "%, " + yPercent + "%) ";
	if (use3D || x !== _zeroPx || y !== _zeroPx || z !== _zeroPx) transforms += z !== _zeroPx || use3D ? "translate3d(" + x + ", " + y + ", " + z + ") " : "translate(" + x + ", " + y + _endParenthesis;
	if (rotation !== _zeroDeg) transforms += "rotate(" + rotation + _endParenthesis;
	if (rotationY !== _zeroDeg) transforms += "rotateY(" + rotationY + _endParenthesis;
	if (rotationX !== _zeroDeg) transforms += "rotateX(" + rotationX + _endParenthesis;
	if (skewX !== _zeroDeg || skewY !== _zeroDeg) transforms += "skew(" + skewX + ", " + skewY + _endParenthesis;
	if (scaleX !== 1 || scaleY !== 1) transforms += "scale(" + scaleX + ", " + scaleY + _endParenthesis;
	target.style[_transformProp] = transforms || "translate(0, 0)";
};
var _renderSVGTransforms = function _renderSVGTransforms(ratio, cache) {
	var _ref2 = cache || this, xPercent = _ref2.xPercent, yPercent = _ref2.yPercent, x = _ref2.x, y = _ref2.y, rotation = _ref2.rotation, skewX = _ref2.skewX, skewY = _ref2.skewY, scaleX = _ref2.scaleX, scaleY = _ref2.scaleY, target = _ref2.target, xOrigin = _ref2.xOrigin, yOrigin = _ref2.yOrigin, xOffset = _ref2.xOffset, yOffset = _ref2.yOffset, forceCSS = _ref2.forceCSS, tx = parseFloat(x), ty = parseFloat(y), a11, a21, a12, a22, temp;
	rotation = parseFloat(rotation);
	skewX = parseFloat(skewX);
	skewY = parseFloat(skewY);
	if (skewY) {
		skewY = parseFloat(skewY);
		skewX += skewY;
		rotation += skewY;
	}
	if (rotation || skewX) {
		rotation *= _DEG2RAD;
		skewX *= _DEG2RAD;
		a11 = Math.cos(rotation) * scaleX;
		a21 = Math.sin(rotation) * scaleX;
		a12 = Math.sin(rotation - skewX) * -scaleY;
		a22 = Math.cos(rotation - skewX) * scaleY;
		if (skewX) {
			skewY *= _DEG2RAD;
			temp = Math.tan(skewX - skewY);
			temp = Math.sqrt(1 + temp * temp);
			a12 *= temp;
			a22 *= temp;
			if (skewY) {
				temp = Math.tan(skewY);
				temp = Math.sqrt(1 + temp * temp);
				a11 *= temp;
				a21 *= temp;
			}
		}
		a11 = _round(a11);
		a21 = _round(a21);
		a12 = _round(a12);
		a22 = _round(a22);
	} else {
		a11 = scaleX;
		a22 = scaleY;
		a21 = a12 = 0;
	}
	if (tx && !~(x + "").indexOf("px") || ty && !~(y + "").indexOf("px")) {
		tx = _convertToUnit(target, "x", x, "px");
		ty = _convertToUnit(target, "y", y, "px");
	}
	if (xOrigin || yOrigin || xOffset || yOffset) {
		tx = _round(tx + xOrigin - (xOrigin * a11 + yOrigin * a12) + xOffset);
		ty = _round(ty + yOrigin - (xOrigin * a21 + yOrigin * a22) + yOffset);
	}
	if (xPercent || yPercent) {
		temp = target.getBBox();
		tx = _round(tx + xPercent / 100 * temp.width);
		ty = _round(ty + yPercent / 100 * temp.height);
	}
	temp = "matrix(" + a11 + "," + a21 + "," + a12 + "," + a22 + "," + tx + "," + ty + ")";
	target.setAttribute("transform", temp);
	forceCSS && (target.style[_transformProp] = temp);
};
var _addRotationalPropTween = function _addRotationalPropTween(plugin, target, property, startNum, endValue) {
	var cap = 360, isString = _isString(endValue), change = parseFloat(endValue) * (isString && ~endValue.indexOf("rad") ? _RAD2DEG : 1) - startNum, finalValue = startNum + change + "deg", direction, pt;
	if (isString) {
		direction = endValue.split("_")[1];
		if (direction === "short") {
			change %= cap;
			if (change !== change % (cap / 2)) change += change < 0 ? cap : -cap;
		}
		if (direction === "cw" && change < 0) change = (change + cap * _bigNum) % cap - ~~(change / cap) * cap;
		else if (direction === "ccw" && change > 0) change = (change - cap * _bigNum) % cap - ~~(change / cap) * cap;
	}
	plugin._pt = pt = new PropTween(plugin._pt, target, property, startNum, change, _renderPropWithEnd);
	pt.e = finalValue;
	pt.u = "deg";
	plugin._props.push(property);
	return pt;
};
var _assign = function _assign(target, source) {
	for (var p in source) target[p] = source[p];
	return target;
};
var _addRawTransformPTs = function _addRawTransformPTs(plugin, transforms, target) {
	var startCache = _assign({}, target._gsap), exclude = "perspective,force3D,transformOrigin,svgOrigin", style = target.style, endCache, p, startValue, endValue, startNum, endNum, startUnit, endUnit;
	if (startCache.svg) {
		startValue = target.getAttribute("transform");
		target.setAttribute("transform", "");
		style[_transformProp] = transforms;
		endCache = _parseTransform(target, 1);
		_removeProperty(target, _transformProp);
		target.setAttribute("transform", startValue);
	} else {
		startValue = getComputedStyle(target)[_transformProp];
		style[_transformProp] = transforms;
		endCache = _parseTransform(target, 1);
		style[_transformProp] = startValue;
	}
	for (p in _transformProps) {
		startValue = startCache[p];
		endValue = endCache[p];
		if (startValue !== endValue && exclude.indexOf(p) < 0) {
			startUnit = getUnit(startValue);
			endUnit = getUnit(endValue);
			startNum = startUnit !== endUnit ? _convertToUnit(target, p, startValue, endUnit) : parseFloat(startValue);
			endNum = parseFloat(endValue);
			plugin._pt = new PropTween(plugin._pt, endCache, p, startNum, endNum - startNum, _renderCSSProp);
			plugin._pt.u = endUnit || 0;
			plugin._props.push(p);
		}
	}
	_assign(endCache, startCache);
};
_forEachName("padding,margin,Width,Radius", function(name, index) {
	var t = "Top", r = "Right", b = "Bottom", l = "Left", props = (index < 3 ? [
		t,
		r,
		b,
		l
	] : [
		t + l,
		t + r,
		b + r,
		b + l
	]).map(function(side) {
		return index < 2 ? name + side : "border" + side + name;
	});
	_specialProps[index > 1 ? "border" + name : name] = function(plugin, target, property, endValue, tween) {
		var a, vars;
		if (arguments.length < 4) {
			a = props.map(function(prop) {
				return _get(plugin, prop, property);
			});
			vars = a.join(" ");
			return vars.split(a[0]).length === 5 ? a[0] : vars;
		}
		a = (endValue + "").split(" ");
		vars = {};
		props.forEach(function(prop, i) {
			return vars[prop] = a[i] = a[i] || a[(i - 1) / 2 | 0];
		});
		plugin.init(target, vars, tween);
	};
});
var CSSPlugin = {
	name: "css",
	register: _initCore,
	targetTest: function targetTest(target) {
		return target.style && target.nodeType;
	},
	init: function init(target, vars, tween, index, targets) {
		var props = this._props, style = target.style, startAt = tween.vars.startAt, startValue, endValue, endNum, startNum, type, specialProp, p, startUnit, endUnit, relative, isTransformRelated, transformPropTween, cache, smooth, hasPriority, inlineProps, finalTransformValue;
		_pluginInitted || _initCore();
		this.styles = this.styles || _getStyleSaver(target);
		inlineProps = this.styles.props;
		this.tween = tween;
		for (p in vars) {
			if (p === "autoRound") continue;
			endValue = vars[p];
			if (_plugins[p] && _checkPlugin(p, vars, tween, index, target, targets)) continue;
			type = typeof endValue;
			specialProp = _specialProps[p];
			if (type === "function") {
				endValue = endValue.call(tween, index, target, targets);
				type = typeof endValue;
			}
			if (type === "string" && ~endValue.indexOf("random(")) endValue = _replaceRandom(endValue);
			if (specialProp) specialProp(this, target, p, endValue, tween) && (hasPriority = 1);
			else if (p.substr(0, 2) === "--") {
				startValue = (getComputedStyle(target).getPropertyValue(p) + "").trim();
				endValue += "";
				_colorExp.lastIndex = 0;
				if (!_colorExp.test(startValue)) {
					startUnit = getUnit(startValue);
					endUnit = getUnit(endValue);
					endUnit ? startUnit !== endUnit && (startValue = _convertToUnit(target, p, startValue, endUnit) + endUnit) : startUnit && (endValue += startUnit);
				}
				this.add(style, "setProperty", startValue, endValue, index, targets, 0, 0, p);
				props.push(p);
				inlineProps.push(p, 0, style[p]);
			} else if (type !== "undefined") {
				if (startAt && p in startAt) {
					startValue = typeof startAt[p] === "function" ? startAt[p].call(tween, index, target, targets) : startAt[p];
					_isString(startValue) && ~startValue.indexOf("random(") && (startValue = _replaceRandom(startValue));
					getUnit(startValue + "") || startValue === "auto" || (startValue += _config.units[p] || getUnit(_get(target, p)) || "");
					(startValue + "").charAt(1) === "=" && (startValue = _get(target, p));
				} else startValue = _get(target, p);
				startNum = parseFloat(startValue);
				relative = type === "string" && endValue.charAt(1) === "=" && endValue.substr(0, 2);
				relative && (endValue = endValue.substr(2));
				endNum = parseFloat(endValue);
				if (p in _propertyAliases) {
					if (p === "autoAlpha") {
						if (startNum === 1 && _get(target, "visibility") === "hidden" && endNum) startNum = 0;
						inlineProps.push("visibility", 0, style.visibility);
						_addNonTweeningPT(this, style, "visibility", startNum ? "inherit" : "hidden", endNum ? "inherit" : "hidden", !endNum);
					}
					if (p !== "scale" && p !== "transform") {
						p = _propertyAliases[p];
						~p.indexOf(",") && (p = p.split(",")[0]);
					}
				}
				isTransformRelated = p in _transformProps;
				if (isTransformRelated) {
					this.styles.save(p);
					finalTransformValue = endValue;
					if (type === "string" && endValue.substring(0, 6) === "var(--") {
						endValue = _getComputedProperty(target, endValue.substring(4, endValue.indexOf(")")));
						if (endValue.substring(0, 5) === "calc(") {
							var origPerspective = target.style.perspective;
							target.style.perspective = endValue;
							endValue = _getComputedProperty(target, "perspective");
							origPerspective ? target.style.perspective = origPerspective : _removeProperty(target, "perspective");
						}
						endNum = parseFloat(endValue);
					}
					if (!transformPropTween) {
						cache = target._gsap;
						cache.renderTransform && !vars.parseTransform || _parseTransform(target, vars.parseTransform);
						smooth = vars.smoothOrigin !== false && cache.smooth;
						transformPropTween = this._pt = new PropTween(this._pt, style, _transformProp, 0, 1, cache.renderTransform, cache, 0, -1);
						transformPropTween.dep = 1;
					}
					if (p === "scale") {
						this._pt = new PropTween(this._pt, cache, "scaleY", cache.scaleY, (relative ? _parseRelative(cache.scaleY, relative + endNum) : endNum) - cache.scaleY || 0, _renderCSSProp);
						this._pt.u = 0;
						props.push("scaleY", p);
						p += "X";
					} else if (p === "transformOrigin") {
						inlineProps.push(_transformOriginProp, 0, style[_transformOriginProp]);
						endValue = _convertKeywordsToPercentages(endValue);
						if (cache.svg) _applySVGOrigin(target, endValue, 0, smooth, 0, this);
						else {
							endUnit = parseFloat(endValue.split(" ")[2]) || 0;
							endUnit !== cache.zOrigin && _addNonTweeningPT(this, cache, "zOrigin", cache.zOrigin, endUnit);
							_addNonTweeningPT(this, style, p, _firstTwoOnly(startValue), _firstTwoOnly(endValue));
						}
						continue;
					} else if (p === "svgOrigin") {
						_applySVGOrigin(target, endValue, 1, smooth, 0, this);
						continue;
					} else if (p in _rotationalProperties) {
						_addRotationalPropTween(this, cache, p, startNum, relative ? _parseRelative(startNum, relative + endValue) : endValue);
						continue;
					} else if (p === "smoothOrigin") {
						_addNonTweeningPT(this, cache, "smooth", cache.smooth, endValue);
						continue;
					} else if (p === "force3D") {
						cache[p] = endValue;
						continue;
					} else if (p === "transform") {
						_addRawTransformPTs(this, endValue, target);
						continue;
					}
				} else if (!(p in style)) p = _checkPropPrefix(p) || p;
				if (isTransformRelated || (endNum || endNum === 0) && (startNum || startNum === 0) && !_complexExp.test(endValue) && p in style) {
					startUnit = (startValue + "").substr((startNum + "").length);
					endNum || (endNum = 0);
					endUnit = getUnit(endValue) || (p in _config.units ? _config.units[p] : startUnit);
					startUnit !== endUnit && (startNum = _convertToUnit(target, p, startValue, endUnit));
					this._pt = new PropTween(this._pt, isTransformRelated ? cache : style, p, startNum, (relative ? _parseRelative(startNum, relative + endNum) : endNum) - startNum, !isTransformRelated && (endUnit === "px" || p === "zIndex") && vars.autoRound !== false ? _renderRoundedCSSProp : _renderCSSProp);
					this._pt.u = endUnit || 0;
					if (isTransformRelated && finalTransformValue !== endValue) {
						this._pt.b = startValue;
						this._pt.e = finalTransformValue;
						this._pt.r = _renderCSSPropWithBeginningAndEnd;
					} else if (startUnit !== endUnit && endUnit !== "%") {
						this._pt.b = startValue;
						this._pt.r = _renderCSSPropWithBeginning;
					}
				} else if (!(p in style)) {
					if (p in target) this.add(target, p, startValue || target[p], relative ? relative + endValue : endValue, index, targets);
					else if (p !== "parseTransform") {
						_missingPlugin(p, endValue);
						continue;
					}
				} else _tweenComplexCSSString.call(this, target, p, startValue, relative ? relative + endValue : endValue);
				isTransformRelated || (p in style ? inlineProps.push(p, 0, style[p]) : typeof target[p] === "function" ? inlineProps.push(p, 2, target[p]()) : inlineProps.push(p, 1, startValue || target[p]));
				props.push(p);
			}
		}
		hasPriority && _sortPropTweensByPriority(this);
	},
	render: function render(ratio, data) {
		if (data.tween._time || !_reverting()) {
			var pt = data._pt;
			while (pt) {
				pt.r(ratio, pt.d);
				pt = pt._next;
			}
		} else data.styles.revert();
	},
	get: _get,
	aliases: _propertyAliases,
	getSetter: function getSetter(target, property, plugin) {
		var p = _propertyAliases[property];
		p && p.indexOf(",") < 0 && (property = p);
		return property in _transformProps && property !== _transformOriginProp && (target._gsap.x || _get(target, "x")) ? plugin && _recentSetterPlugin === plugin ? property === "scale" ? _setterScale : _setterTransform : (_recentSetterPlugin = plugin || {}) && (property === "scale" ? _setterScaleWithRender : _setterTransformWithRender) : target.style && !_isUndefined(target.style[property]) ? _setterCSSStyle : ~property.indexOf("-") ? _setterCSSProp : _getSetter(target, property);
	},
	core: {
		_removeProperty,
		_getMatrix
	}
};
gsap.utils.checkPrefix = _checkPropPrefix;
gsap.core.getStyleSaver = _getStyleSaver;
(function(positionAndScale, rotation, others, aliases) {
	var all = _forEachName(positionAndScale + "," + rotation + "," + others, function(name) {
		_transformProps[name] = 1;
	});
	_forEachName(rotation, function(name) {
		_config.units[name] = "deg";
		_rotationalProperties[name] = 1;
	});
	_propertyAliases[all[13]] = positionAndScale + "," + rotation;
	_forEachName(aliases, function(name) {
		var split = name.split(":");
		_propertyAliases[split[1]] = all[split[0]];
	});
})("x,y,z,scale,scaleX,scaleY,xPercent,yPercent", "rotation,rotationX,rotationY,skewX,skewY", "transform,transformOrigin,svgOrigin,force3D,smoothOrigin,transformPerspective", "0:translateX,1:translateY,2:translateZ,8:rotate,8:rotationZ,8:rotateZ,9:rotateX,10:rotateY");
_forEachName("x,y,z,top,right,bottom,left,width,height,fontSize,padding,margin,perspective", function(name) {
	_config.units[name] = "px";
});
gsap.registerPlugin(CSSPlugin);
//#endregion
//#region ../celestial-frontier-anthropic-mac/port/v2/node_modules/gsap/index.js
var gsapWithCSS = gsap.registerPlugin(CSSPlugin) || gsap;
gsapWithCSS.core.Tween;
//#endregion
//#region ../celestial-frontier-anthropic-mac/port/v2/apps/game/src/motion/gsap-adapter.ts
const GSAP_EASE = Object.freeze({
	"ease-out": "power1.out",
	"ease-in": "power1.in",
	"back-out": "back.out(1.70158)",
	"sine-in-out": "sine.inOut"
});
function createGsapPlayer(timeline, target, options) {
	const g = options.gsapLib ?? gsapWithCSS;
	const values = {}, root = {
		dx: 0,
		dy: 0
	};
	const tl = g.timeline({
		paused: true,
		repeat: timeline.loop ? -1 : 0
	});
	const addTrack = (obj, key, keys) => {
		for (let i = 1; i < keys.length; i++) {
			const a = keys[i - 1], b = keys[i], dur = Math.max(0, b.ms - a.ms) / 1e3;
			tl.to(obj, {
				[key]: b.value,
				duration: dur,
				ease: GSAP_EASE[b.ease],
				overwrite: false
			}, a.ms / 1e3);
		}
	};
	const secondaryJoints = new Map(timeline.secondary.map((s) => [s.joint, s]));
	for (const [joint, keys] of Object.entries(timeline.tracks)) {
		const s = secondaryJoints.get(joint);
		values[joint] = { v: keys[0]?.value ?? 0 };
		addTrack(values[joint], "v", s && !s.rigid ? s.keys : keys);
	}
	addTrack(root, "dx", timeline.root.dx);
	addTrack(root, "dy", timeline.root.dy);
	tl.to({}, { duration: timeline.durationMs / 1e3 }, 0);
	const push = () => {
		for (const [joint, cell] of Object.entries(values)) target.setJoint(joint, cell.v, joint === "root" ? root.dx : 0, joint === "root" ? root.dy : 0);
	};
	let startMs = 0, running = false;
	const seek = (ms) => {
		if (timeline.loop) {
			const w = (ms % timeline.bodyMs + timeline.bodyMs) % timeline.bodyMs;
			tl.time(w / 1e3, false);
			for (const s of timeline.secondary) if (!s.rigid) values[s.joint].v = sampleKeys(s.keys, ((w - s.lagMs) % timeline.bodyMs + timeline.bodyMs) % timeline.bodyMs + s.lagMs);
		} else tl.time(Math.min(Math.max(ms, 0), timeline.durationMs) / 1e3, false);
		push();
	};
	return {
		timeline,
		start() {
			startMs = options.now();
			running = true;
			seek(0);
		},
		tick() {
			if (!running) return 0;
			const ms = options.now() - startMs;
			seek(ms);
			return timeline.loop ? ms % timeline.bodyMs / timeline.bodyMs : Math.min(1, ms / timeline.durationMs);
		},
		seek,
		stop() {
			running = false;
			tl.kill();
		}
	};
}
Object.freeze({
	parts: 40,
	bones: 32,
	atlas: {
		desktop: 2048,
		phone: 1024
	},
	updateMs: {
		desktop: 2,
		phone: 4
	},
	effect: {
		phaseTextures: 3,
		particles: 200
	},
	frameRate: {
		desktop: 60,
		phone: 30
	}
});
//#endregion
//#region port/v2/tools/quadruped-proof/turn-performance.mjs
/** The proof consumes the pinned producer without modifying any creature curve.
* Pure explicit-time turn sampling is shared by gates and the filmed frame owner. */
function createTurnPoseSampler(createGsapPlayer) {
	const players = /* @__PURE__ */ new Map();
	let disposed = false;
	const clipPose = (clip, ms) => {
		if (disposed) throw Error("Turn pose sampler disposed");
		if (clip.source !== "timeline") return {};
		let entry = players.get(clip);
		if (!entry) {
			const pose = {};
			entry = {
				pose,
				player: createGsapPlayer(clip.timeline, { setJoint(name, rotation, dx, dy) {
					pose[name] = {
						rotation,
						dx,
						dy
					};
				} }, { now: () => {
					throw Error("Proof sampler must not read a clock");
				} })
			};
			players.set(clip, entry);
		}
		entry.player.seek(ms);
		return entry.pose;
	};
	const add = (a, b) => {
		const out = {};
		for (const source of [a, b]) for (const [n, v] of Object.entries(source)) {
			const old = out[n] ?? {
				rotation: 0,
				dx: 0,
				dy: 0
			};
			out[n] = {
				rotation: old.rotation + v.rotation,
				dx: old.dx + (v.dx ?? 0),
				dy: old.dy + (v.dy ?? 0)
			};
		}
		return out;
	};
	const sample = (plan, ms, target = false, idleOverride) => {
		if (disposed || !Number.isFinite(ms) || ms < 0) throw Error("Invalid turn sample");
		const b = plan.beats, c = plan.clips, ic = ms < b.impactAt ? ms : ms < b.hitstopEnd ? b.impactAt : ms - (b.hitstopEnd - b.impactAt);
		const idle = idleOverride ? clipPose(idleOverride.clip, idleOverride.ms) : clipPose(target ? c.target.idle : c.attacker.idle, ic);
		if (target) {
			let pose = idle;
			if (c.target.reaction && ms >= b.reactionStart) pose = add(pose, clipPose(c.target.reaction, ms - b.reactionStart));
			return pose;
		}
		let pose = idle;
		if (ms >= b.commandEnd && ms < b.actionStart) pose = add(pose, clipPose(c.attacker.approach, (ms - b.commandEnd) / (b.actionStart - b.commandEnd) * c.attacker.approach.timeline.durationMs));
		else if (ms >= b.actionStart && ms < b.actionEnd) pose = add(pose, clipPose(c.attacker.action, ic - b.actionStart));
		else if (ms >= b.actionEnd && ms < b.returnEnd) pose = add(pose, clipPose(c.attacker.approach, (ms - b.actionEnd) / (b.returnEnd - b.actionEnd) * c.attacker.approach.timeline.durationMs));
		else if (ms >= b.returnEnd && plan.targetFaints) pose = add(pose, clipPose(c.attacker.after, ms - b.returnEnd));
		return pose;
	};
	return {
		sample,
		/** One subject keeps its own seeded idle across the two proof roles. Both
		* hitstop intervals pause this explicit clock; a role change never resets it. */
		sampleSequence(plans, ms) {
			const frame = turnSequenceFrame(plans, ms);
			let held = 0;
			for (let i = 0; i <= frame.index; i++) {
				const b = plans[i].beats, local = ms - i * 5e3;
				held += Math.max(0, Math.min(local - b.impactAt, b.hitstopEnd - b.impactAt));
			}
			return sample(frame.plan, frame.localMs, frame.target, {
				clip: plans[0].clips.attacker.idle,
				ms: ms - held
			});
		},
		dispose() {
			if (disposed) return;
			disposed = true;
			for (const entry of players.values()) entry.player.stop();
			players.clear();
		}
	};
}
/** The existing ten-second proof consists of two fixed five-second turn roles.
* This does not retime compiler clips or a battle's authoritative turn plan. */
function turnSequenceFrame(plans, ms) {
	if (!Array.isArray(plans) || plans.length !== 2 || !Number.isFinite(ms) || ms < 0 || ms > 1e4) throw Error("Invalid turn sequence");
	for (const p of plans) {
		const b = p?.beats;
		if (!b || ![b.impactAt, b.hitstopEnd].every(Number.isFinite) || b.impactAt < 0 || b.hitstopEnd < b.impactAt || b.hitstopEnd > 5e3) throw Error("Invalid turn hitstop");
	}
	const index = ms >= 5e3 ? 1 : 0;
	return {
		index,
		plan: plans[index],
		localMs: ms - index * 5e3,
		target: index === 1
	};
}
//#endregion
//#region port/v2/tools/creature-animation/kinematics.ts
const IDENTITY_AFFINE = Object.freeze([
	1,
	0,
	0,
	1,
	0,
	0
]);
const KINEMATICS_LIMITS = Object.freeze({
	maxCoordinate: 1e6,
	minSegment: 1e-6,
	maxChainPoints: 64,
	maxDurationMs: 6e4,
	maxWaveCycles: 8
});
const ZERO = Object.freeze({
	x: 0,
	y: 0
});
function finite(value, label) {
	if (typeof value !== "number" || !Number.isFinite(value)) throw new TypeError(label + " must be finite");
}
function point$1(value) {
	if (!value || typeof value !== "object") throw new TypeError("point required");
	finite(value.x, "point x");
	finite(value.y, "point y");
	if (Math.abs(value.x) > KINEMATICS_LIMITS.maxCoordinate || Math.abs(value.y) > KINEMATICS_LIMITS.maxCoordinate) throw new RangeError("point exceeds coordinate bound");
	return Object.freeze({
		x: value.x,
		y: value.y
	});
}
function affine(value) {
	if (!Array.isArray(value) || value.length !== 6) throw new TypeError("six affine coefficients required");
	for (let i = 0; i < 6; i++) finite(value[i], "affine coefficient");
}
function transformPoint(matrix, input) {
	affine(matrix);
	const p = point$1(input);
	return point$1({
		x: matrix[0] * p.x + matrix[2] * p.y + matrix[4],
		y: matrix[1] * p.x + matrix[3] * p.y + matrix[5]
	});
}
function composeAffine(parent, local) {
	affine(parent);
	affine(local);
	const result = [
		parent[0] * local[0] + parent[2] * local[1],
		parent[1] * local[0] + parent[3] * local[1],
		parent[0] * local[2] + parent[2] * local[3],
		parent[1] * local[2] + parent[3] * local[3],
		parent[0] * local[4] + parent[2] * local[5] + parent[4],
		parent[1] * local[4] + parent[3] * local[5] + parent[5]
	];
	affine(result);
	return Object.freeze(result);
}
function rotationAround(pivot, radians, offset = ZERO) {
	const p = point$1(pivot), move = point$1(offset);
	finite(radians, "rotation");
	if (radians === 0 && move.x === 0 && move.y === 0) return IDENTITY_AFFINE;
	const c = Math.cos(radians), s = Math.sin(radians);
	const matrix = [
		c,
		s,
		-s,
		c,
		p.x - c * p.x + s * p.y + move.x,
		p.y - s * p.x - c * p.y + move.y
	];
	return Object.freeze(matrix);
}
const length = (a, b) => Math.hypot(b.x - a.x, b.y - a.y);
const same = (a, b) => a.x === b.x && a.y === b.y;
function segment(a, b) {
	const value = length(a, b);
	if (value < KINEMATICS_LIMITS.minSegment) throw new RangeError("degenerate chain segment");
	return value;
}
/** A bend sign selects the side of root→end occupied by the joint. A fully
* extended rest chain needs that explicit sign; the solver never guesses a limb.
* Unreachable targets are rejected rather than moving a requested fixed contact. */
function createTwoBoneChain(input) {
	if (!input || input.bend !== 1 && input.bend !== -1) throw new TypeError("explicit bend sign required");
	const root = point$1(input.root), joint = point$1(input.joint), end = point$1(input.end), bend = input.bend;
	const upper = segment(root, joint), lower = segment(joint, end), distance = segment(root, end);
	const side = (end.x - root.x) * (joint.y - root.y) - (end.y - root.y) * (joint.x - root.x);
	const tolerance = (upper + lower) * 1e-10;
	if (Math.abs(side) > tolerance * (upper + lower) && Math.sign(side) !== bend) throw new RangeError("bend sign contradicts rest geometry");
	if (distance <= Math.abs(upper - lower) + tolerance) throw new RangeError("folded rest chain has no stable direction");
	const rest = Object.freeze({
		root,
		joint,
		end,
		upperMatrix: IDENTITY_AFFINE,
		lowerMatrix: IDENTITY_AFFINE
	});
	return Object.freeze({
		lengths: Object.freeze({
			upper,
			lower
		}),
		rest: () => rest,
		solve(targetRoot, targetEnd) {
			const r = point$1(targetRoot), e = point$1(targetEnd);
			if (same(r, root) && same(e, end)) return rest;
			const d = length(r, e), min = Math.abs(upper - lower), max = upper + lower;
			if (d < KINEMATICS_LIMITS.minSegment || d < min || d > max) throw new RangeError("target outside two-bone reach");
			const ux = (e.x - r.x) / d, uy = (e.y - r.y) / d;
			const along = (upper * upper - lower * lower + d * d) / (2 * d);
			const altitude = Math.sqrt(Math.max(0, upper * upper - along * along));
			const j = point$1({
				x: r.x + ux * along - uy * altitude * bend,
				y: r.y + uy * along + ux * altitude * bend
			});
			const upperAngle = Math.atan2(j.y - r.y, j.x - r.x) - Math.atan2(joint.y - root.y, joint.x - root.x);
			const lowerAngle = Math.atan2(e.y - j.y, e.x - j.x) - Math.atan2(end.y - joint.y, end.x - joint.x);
			return Object.freeze({
				root: r,
				joint: j,
				end: e,
				upperMatrix: rotationAround(root, upperAngle, {
					x: r.x - root.x,
					y: r.y - root.y
				}),
				lowerMatrix: rotationAround(joint, lowerAngle, {
					x: j.x - joint.x,
					y: j.y - joint.y
				})
			});
		}
	});
}
Object.freeze({
	id: "quadruped",
	version: 1,
	clipSetId: "quadruped-land-v1",
	clips: Object.freeze({
		rest: 0,
		idle: 3e3,
		attack: 2200,
		hit: 1300
	}),
	layers: Object.freeze(["far", "near"])
});
const LEGS = Object.freeze([
	"hindFar",
	"foreFar",
	"hindNear",
	"foreNear"
]);
const GRAPH = Object.freeze([
	["pelvis", "root"],
	["spine", "pelvis"],
	["chest", "spine"],
	["neck", "chest"],
	["head", "neck"],
	["jaw", "head"],
	...LEGS.flatMap((id) => [
		[id + "Root", id.startsWith("hind") ? "pelvis" : "chest"],
		[id + "Knee", id + "Root"],
		[id + "Ankle", id + "Knee"],
		[id + "Paw", id + "Ankle"]
	]),
	["tail0", "pelvis"],
	["tail1", "tail0"],
	["tail2", "tail1"],
	["tail3", "tail2"],
	["earFarRoot", "head"],
	["earFarTip", "earFarRoot"],
	["earNearRoot", "head"],
	["earNearTip", "earNearRoot"]
].map(Object.freeze));
[...GRAPH.map((b) => b[0])];
//#endregion
//#region port/v2/apps/game/src/creature-rig-contact.ts
const point = (p) => ({
	x: p[0],
	y: p[1]
});
const legs = [
	"hindFar",
	"foreFar",
	"hindNear",
	"foreNear"
];
const angle = (a, b) => Math.atan2(b.y - a.y, b.x - a.x);
const wrapped = (a) => Math.atan2(Math.sin(a), Math.cos(a));
function poseMatrices(record, pose) {
	const matrices = {}, length = Math.hypot(record.landmarks.chest[0] - record.landmarks.pelvis[0], record.landmarks.chest[1] - record.landmarks.pelvis[1]);
	for (const [name, parent] of [["root", null], ...GRAPH]) {
		const key = pose[name], pivot = point(record.landmarks[parent ?? "root"]);
		const local = key ? rotationAround(pivot, key.rotation, {
			x: (key.dx ?? 0) * length,
			y: (key.dy ?? 0) * length
		}) : IDENTITY_AFFINE;
		matrices[name] = parent ? composeAffine(matrices[parent], local) : local;
	}
	return matrices;
}
function createQuadrupedContactSolver(record) {
	if (record.template.id !== "quadruped") throw Error("Contact solver requires quadruped");
	const length = Math.hypot(record.landmarks.chest[0] - record.landmarks.pelvis[0], record.landmarks.chest[1] - record.landmarks.pelvis[1]);
	const chains = legs.map((id) => {
		const root = point(record.landmarks[id + "Root"]), joint = point(record.landmarks[id + "Knee"]), end = point(record.landmarks[id + "Ankle"]);
		return {
			id,
			root,
			joint,
			end,
			chain: createTwoBoneChain({
				root,
				joint,
				end,
				bend: (end.x - root.x) * (joint.y - root.y) - (end.y - root.y) * (joint.x - root.x) < 0 ? -1 : 1
			})
		};
	});
	return { resolve(input, planted) {
		if (!planted) return {
			pose: input,
			compression: 0
		};
		const pose = Object.fromEntries(Object.entries(input).map(([j, k]) => [j, { ...k }]));
		let matrices = poseMatrices(record, pose), compression = 0;
		for (const c of chains) {
			const root = transformPoint(matrices[c.id + "Root"], c.root), dx = c.end.x - root.x, max = c.chain.lengths.upper + c.chain.lengths.lower;
			if (Math.abs(dx) >= max) throw Error("Planted contact outside horizontal reach");
			compression = Math.max(compression, c.end.y - Math.sqrt(max * max - dx * dx) + 1e-10 - root.y);
		}
		if (compression > length * .08) throw Error("Planted contact exceeds quadruped compression bound");
		if (compression > 0) {
			pose.root = {
				rotation: 0,
				...pose.root,
				dy: (pose.root?.dy ?? 0) + compression / length
			};
			matrices = poseMatrices(record, pose);
		}
		for (const c of chains) {
			const parent = matrices[c.id + "Root"], root = transformPoint(parent, c.root), solved = c.chain.solve(root, c.end);
			const upper = wrapped(angle(solved.root, solved.joint) - angle(c.root, c.joint));
			const lower = wrapped(angle(solved.joint, solved.end) - angle(c.joint, c.end));
			pose[c.id + "Knee"] = { rotation: wrapped(upper - Math.atan2(parent[1], parent[0])) };
			pose[c.id + "Ankle"] = { rotation: wrapped(lower - upper) };
			pose[c.id + "Paw"] = { rotation: wrapped(-lower) };
		}
		return {
			pose,
			compression
		};
	} };
}
//#endregion
//#region port/v2/tools/creature-animation/compiled-skin-field.mjs
/** Compiled sparse linear blend field. No motion, solver or topology changes.
* Compilation explicitly snapshots source geometry/weights. Every application
* reads CURRENT matrices; there is no matrix-identity or output-result cache.
* Private scratch prevents failed frames from partially publishing geometry.
*/
const states = /* @__PURE__ */ new WeakMap();
const fail = (message) => {
	throw Error("Compiled skin field: " + message);
};
function createCompiledSkinField(skin, width, height) {
	if (!Number.isFinite(width) || width <= 0 || !Number.isFinite(height) || height <= 0) fail("dimensions");
	if (skin?.schema !== "cf.paint-skin/v1" || !Array.isArray(skin.vertices) || skin.vertices.length < 3 || skin.vertices.length > 4e4) fail("source vertices");
	const vertexCount = skin.vertices.length, jointNames = [], jointIds = /* @__PURE__ */ new Map();
	const positions = new Float64Array(vertexCount * 2), offsets = new Uint32Array(vertexCount + 1);
	let weightCount = 0;
	for (let i = 0; i < vertexCount; i++) {
		const vertex = skin.vertices[i];
		if (!vertex || !Number.isFinite(vertex.x) || !Number.isFinite(vertex.y) || vertex.x < 0 || vertex.x > width || vertex.y < 0 || vertex.y > height || !Array.isArray(vertex.weights) || !vertex.weights.length || vertex.weights.length > 8) fail("source vertex");
		positions[i * 2] = vertex.x / width;
		positions[i * 2 + 1] = vertex.y / height;
		offsets[i] = weightCount;
		let sum = 0;
		const used = /* @__PURE__ */ new Set();
		for (const entry of vertex.weights) {
			if (!Array.isArray(entry) || entry.length !== 2) fail("source weight");
			const [joint, weight] = entry;
			if (typeof joint !== "string" || !joint.length || used.has(joint) || !Number.isFinite(weight) || weight <= 0 || weight > 1) fail("source weight");
			used.add(joint);
			sum += weight;
			weightCount++;
			if (!jointIds.has(joint)) {
				jointIds.set(joint, jointNames.length);
				jointNames.push(joint);
			}
		}
		if (Math.abs(sum - 1) > 1e-8) fail("source weight sum");
	}
	offsets[vertexCount] = weightCount;
	const matrixOffsets = new Uint32Array(weightCount), weights = new Float64Array(weightCount);
	let entryIndex = 0;
	for (const vertex of skin.vertices) for (const [joint, weight] of vertex.weights) {
		matrixOffsets[entryIndex] = jointIds.get(joint) * 6;
		weights[entryIndex++] = weight;
	}
	const state = Object.freeze({
		vertexCount,
		jointCount: jointNames.length,
		weightCount
	});
	states.set(state, {
		positions,
		offsets,
		matrixOffsets,
		weights,
		jointNames,
		matrixValues: new Float64Array(jointNames.length * 6),
		scratch32: new Float32Array(vertexCount * 2),
		scratch64: new Float64Array(vertexCount * 2)
	});
	return state;
}
/**
* Each required joint lookup and each of its six components is read once per
* call, including when matrix objects are edited in place between calls.
* Weight order and Number arithmetic match applyPaintSkin exactly. The output
* remains byte-identical to its prior state on missing/invalid/overflow input.
*/
function applyCompiledSkinField(state, matrices, output) {
	const data = states.get(state);
	if (!data) fail("unknown compiled state");
	if (!(output instanceof Float32Array || output instanceof Float64Array) || output.length !== state.vertexCount * 2) fail("position buffer");
	if (!matrices || typeof matrices !== "object") fail("matrices");
	const { positions, offsets, matrixOffsets, weights, jointNames, matrixValues } = data;
	for (let joint = 0; joint < jointNames.length; joint++) {
		const name = jointNames[joint], matrix = matrices[name];
		if (!Object.hasOwn(matrices, name) || !matrix || matrix.length !== 6) fail("matrix: " + name);
		const offset = joint * 6;
		for (let component = 0; component < 6; component++) {
			const value = matrix[component];
			if (!Number.isFinite(value)) fail("matrix: " + name);
			matrixValues[offset + component] = value;
		}
	}
	const scratch = output instanceof Float32Array ? data.scratch32 : data.scratch64;
	for (let vertex = 0; vertex < state.vertexCount; vertex++) {
		const index = vertex * 2, x = positions[index], y = positions[index + 1];
		let px = 0, py = 0;
		for (let entry = offsets[vertex]; entry < offsets[vertex + 1]; entry++) {
			const matrix = matrixOffsets[entry], weight = weights[entry];
			px += (matrixValues[matrix] * x + matrixValues[matrix + 2] * y + matrixValues[matrix + 4]) * weight;
			py += (matrixValues[matrix + 1] * x + matrixValues[matrix + 3] * y + matrixValues[matrix + 5]) * weight;
		}
		scratch[index] = px;
		scratch[index + 1] = py;
		if (!Number.isFinite(scratch[index]) || !Number.isFinite(scratch[index + 1])) fail("overflow");
	}
	output.set(scratch);
}
//#endregion
//#region port/v2/tools/quadruped-proof/turn-contact-transition.mjs
const smooth = (t) => {
	const x = Math.max(0, Math.min(1, t));
	return x * x * (3 - 2 * x);
};
const finitePose = (pose) => {
	if (!pose || typeof pose !== "object" || Array.isArray(pose)) throw Error("Invalid turn contact pose");
	for (const key of Object.values(pose)) if (!key || ![
		key.rotation,
		key.dx ?? 0,
		key.dy ?? 0
	].every(Number.isFinite)) throw Error("Nonfinite turn contact pose");
	return pose;
};
/** Stateless support transitions for the current proof's two-turn sequence.
* The existing solver admits each grounded boundary under its unchanged bound.
* Its correction fades over the existing approach/return window; an airborne
* pose is never forced through a grounded solve or a weakened contact limit.
* Plan snapshots prevent later caller edits from invalidating cached boundaries.
*/
function createTurnContactSampler({ plans: inputPlans, motionSampler, solver }) {
	const plans = structuredClone(inputPlans);
	turnSequenceFrame(plans, 0);
	if (typeof motionSampler?.sampleSequence !== "function" || typeof solver?.resolve !== "function") throw Error("Turn contact owners required");
	const beats = plans[0].beats;
	if (![
		beats.commandEnd,
		beats.actionStart,
		beats.actionEnd,
		beats.returnEnd
	].every(Number.isFinite) || beats.commandEnd < 0 || beats.commandEnd >= beats.actionStart || beats.actionStart >= beats.actionEnd || beats.actionEnd >= beats.returnEnd || beats.returnEnd >= 5e3) throw Error("Invalid support windows");
	const sample = (ms) => finitePose(structuredClone(motionSampler.sampleSequence(plans, ms)));
	const boundary = (ms) => {
		const raw = sample(ms), solved = solver.resolve(raw, true);
		finitePose(solved.pose);
		if (!Number.isFinite(solved.compression) || solved.compression < 0) throw Error("Invalid contact compression");
		const delta = {};
		for (const name of /* @__PURE__ */ new Set([...Object.keys(raw), ...Object.keys(solved.pose)])) {
			const a = raw[name], b = solved.pose[name];
			delta[name] = {
				rotation: (b?.rotation ?? 0) - (a?.rotation ?? 0),
				dx: (b?.dx ?? 0) - (a?.dx ?? 0),
				dy: (b?.dy ?? 0) - (a?.dy ?? 0)
			};
		}
		return {
			delta,
			compression: solved.compression
		};
	};
	const release = boundary(beats.commandEnd), landing = boundary(beats.returnEnd);
	return {
		sample,
		resolve(ms, sampledPose) {
			const frame = turnSequenceFrame(plans, ms), raw = sampledPose === void 0 ? sample(ms) : finitePose(structuredClone(sampledPose)), t = frame.localMs;
			if (frame.target || t <= beats.commandEnd || t >= beats.returnEnd) {
				const solved = solver.resolve(raw, true);
				finitePose(solved.pose);
				return {
					...solved,
					raw,
					planted: true,
					supportWeight: 1,
					role: frame.target ? "target" : "attacker",
					localMs: t
				};
			}
			let supportWeight = 0, correction;
			if (t < beats.actionStart) {
				supportWeight = 1 - smooth((t - beats.commandEnd) / (beats.actionStart - beats.commandEnd));
				correction = release;
			} else if (t >= beats.actionEnd) {
				supportWeight = smooth((t - beats.actionEnd) / (beats.returnEnd - beats.actionEnd));
				correction = landing;
			}
			let pose = raw;
			if (supportWeight > 0) {
				pose = {};
				for (const name of /* @__PURE__ */ new Set([...Object.keys(raw), ...Object.keys(correction.delta)])) {
					const a = raw[name], d = correction.delta[name];
					pose[name] = {
						rotation: (a?.rotation ?? 0) + (d?.rotation ?? 0) * supportWeight,
						dx: (a?.dx ?? 0) + (d?.dx ?? 0) * supportWeight,
						dy: (a?.dy ?? 0) + (d?.dy ?? 0) * supportWeight
					};
				}
			}
			finitePose(pose);
			return {
				pose,
				raw,
				compression: (correction?.compression ?? 0) * supportWeight,
				planted: false,
				supportWeight,
				role: "attacker",
				localMs: t
			};
		}
	};
}
//#endregion
//#region \0probe
function createProbe(record, skin, plans) {
	const sampler = createTurnPoseSampler(createGsapPlayer), solver = createQuadrupedContactSolver(record), compiled = createCompiledSkinField(skin, record.geometry.width, record.geometry.height);
	const contact = createTurnContactSampler({
		plans,
		motionSampler: sampler,
		solver
	});
	const field = (pose) => {
		const a = new Float64Array(skin.vertices.length * 2);
		applyCompiledSkinField(compiled, poseMatrices(record, pose), a);
		for (let i = 0; i < a.length; i++) a[i] *= i % 2 ? record.geometry.height : record.geometry.width;
		return a;
	};
	return {
		sample(ms) {
			const raw = contact.sample(ms), resolved = contact.resolve(ms, raw);
			return {
				ms,
				planted: resolved.planted,
				raw,
				pose: resolved.pose,
				rawField: field(raw),
				resolvedField: field(resolved.pose),
				compression: resolved.compression
			};
		},
		dispose() {
			sampler.dispose();
		}
	};
}
//#endregion
export { createProbe };
