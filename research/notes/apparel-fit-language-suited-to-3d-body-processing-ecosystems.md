---
title: Apparel Fit Language Suited to 3D Body Processing Ecosystems
id: apparel-fit-language-suited-to-3d-body-processing-ecosystems
tags:
- modelista-producao-moda-dores-0698af
created: '2026-11-27T02:34:08.710743Z'
source: https://www.3dbody.tech/cap/papers/2022/2241scott.pdf
source_domain: www.3dbody.tech
fetched_at: '2026-11-27T02:34:08.699920Z'
fetch_provider: crawl4ai
status: draft
type: note
tier: institutional
content_type: paper
deprecated: false
raw_file: raw/apparel-fit-language-suited-to-3d-body-processing-ecosystems.pdf
utility_score: 18.0
---

Apparel Fit Language Suited to 3D Body Processing Ecosystems 
Emma SCOTT *1, Simeon GILL 2, Susan ASHDOWN 3, Gerald RUDERMAN 4 
1 Fashion Should Empower, Victoria, BC, Canada; 
2 Dept. Of Materials, The University of Manchester, Manchester, UK; 
3 Cornell University, Ithaca, NY, USA; 
4 Zdoit, Brooklyn, NY, USA 
https://doi.org/10.15221/22.41      
Abstract 
Colloquial language, reflective of the diversity of practitioners involved in 3D Body Processing (3DBP), 
has proven to be an obstacle toward shared digitization efforts. Here we distill language specific to 
apparel manufacturing for clarity toward the shared goals of the 3DBP ecosystem. The whitepaper “3D 
Body Processing Ecosystem Overview” simplified the processes within the 3DBP ecosystem using four 
assets: cover, coveroid, human, and humanoid. From this we understand a cover to be any product, 
garment, or material worn on a human and a coveroid and humanoid to be the models of the finished 
forms. Here we build upon this foundation to consider where language fails to provide clarity crossing 
the physical to virtual realms within the 3DBP ecosystem.  Through this discussion, apparel challenges 
are highlighted from both the perspective of the apparel practitioner (requiring subjective, heuristic, 
sensory processes) and the software architect (requiring objective, logical processes). Perspectives on 
fit are provided clarity for future dialogue toward cross-platform solutions suited to the 3DBP ecosystem. 
The terms are applicable beyond the influence of current trends or style aesthetics and therefore scal-
able, relevant to well established manufacturing practices, yet sensitive to the art of garment design 
which is, and will remain, foundational to apparel practice. 
 
Keywords: garment fit, fit, 4D fit, fit assessment, fit mapping, 3DBP ecosystem, humanoid, coveroid 
1. Introduction 
Discussion herein considers apparel fit language suited to both physical and digital space apparel prac-
tice with the goal to engage conversation toward a larger treatise for a thorough dissemination of ap-
parel fit language. Terminology will reference the four assets summarizing processes within the 3DBP 
ecosystem where the term humanoid is understood to be any representation of a human, cover is un-
derstood to be any body-worn product, and coveroid is any representation of a cover. As the act of 
modelling humans and covers is established apparel practice, the terms humanoid and coveroid can 
be understood to be models (representations) of physical objects in either physical or digital space. 
The term cover includes all finished body worn products including molded products and wearables 
(body-worn products meant to monitor the bio-chemical activity of the wearer). Covers for consumers 
or wearers (humans) are developed on models (humanoids) as test samples (coveroids). [1] 
 
This paper will discuss apparel fit terminology to ensure definitions bridge the physical to digital realms 
concerning the following areas of discussion. 
 
1. Humans and Humanoids Body Data 
2. Covers and Coveroid Geometry 
3. Cover and Coveroid Sizing  
4. Human-to-Cover and Humanoid-to-Coveroid Interaction - Fit Assessment 
 
2. Terminology 
2.1. Human and Humanoid Body Data 
3D Humanoids 
A humanoid is any representation of the human used for product development. 3D humanoids can be 
created from real or synthetic human body data (see below). There are numerous methods available 
for both booth scanners and photogrammetry scanning apps. 
 
 
* connect@fashionshouldempower.com 
Proceedings of 3DBODY.TECH 2022 
13th Int. Conference and Exhibition on 3D Body Scanning and Processing Technologies, 25-26 Oct. 2022, Lugano, Switzerland
#41


---

 
 
2.1.1 - 1D Humanoids (Measurement Data) 
In both physical and virtual space apparel environments the measurement data set, used to create 
covers, exists as a 1D representation of the human. Human body data (measurements) are acquired 
either heuristically (using visual landmarking cues and honed technique), using known anthropometric 
process [2][3][4], algorithmically using proprietary devices in physical environments[5], or using extrac-
tion software in virtual environments. Measurements can be generalized as horizontal girths and vertical 
lengths taken as either surface dimensions (closely following body contours) or linear dimensions 
(straight-line distances between landmarks). In virtual space practice measurements are observed on 
2D cross-sections. In virtual environments, split-lines direct cross-sectional planes from which meas-
urements are retrieved as perimeter distances, girths, or linear dimensions. 
 
2.1.2 - 2D Humanoids (2D Body-Shape) 
In virtual environments, the 3D humanoid may be flattened (UV unwrapping) for a 2D humanoid model. 
Considering a humanoid may be flattened we can begin to imagine that a quantification of body-shape 
as a coveroid is possible. A flattened humanoid, however, is not directly usable within traditional apparel 
pattern-engineering practice. Just as the 1D and 2D dimensions of a sphere will vary, so too will the 1D 
and 2D dimensions of human body-shape vary. For 2D flattened humanoid geometry to be suitable for 
use as a developable pattern (suitable for manufacture) shaping devices (see below) must be added. 
Efforts to systemize this process for direct link to apparel CAD are ongoing.[6] [7] 
 
2.1.3 Static Humanoids 
A static humanoid is concerned with only a single moment in time. In physical space, dress forms (used 
for fitting and sampling), and mannequins (used for display) are examples of static humanoids. In virtual 
space, static humanoids exist as real (scanned human body) or a statistically generated humanoid body 
data (generated from population data).  
 
2.1.4 Rigged Humanoids 
Since a single moment-in-time static does not fully capture the breathing and constantly changing na-
ture of human morphology, dynamic models are used in both virtual and physical space for 4D testing 
of cover and coveroid products. In physical environments fit models are used for 4D fittings involving 
motion. In virtual environments humanoids may be provided a virtual skeleton (rig) for simulating human 
movement. 
 
2.1.5 Statistical Humanoid Data 
Humanoids can be generated from statistical data (the averaging of left and right sides). To better rep-
resent the dynamic nature of human bodies, measurement data gathered from several days or from 
several scans may be statistically compiled for a more accurate representation of the human.  
 
2.1.6 Synthetic Humanoid Data 
Synthetic humanoid data are compiled from population or demographic data. Such data forms the basis 
of size charts. In physical space this data is used to create mannequins. In digital space, humanoids 
can be parametrically generated from such data. 
 
2.1.7 Body Segments 
Body segments, sometimes referred to as patches, identify body areas between two joint landmarks. 
For example, the leg is divided into upper and lower segments by the hip, knee, and ankle landmarks. 
Coveroid pattern geometry (blocks) also reference these same body segments. Base body segments, 
reflective of the skeleton and coveroid pattern geometry are head, neck, arms, hands, mid torso, lower 
torso, legs, and feet. Since human shape is complex, segments are further sub-divided into regions for 
detailed analysis of morphology. [8] 
 
Proceedings of 3DBODY.TECH 2022 
13th Int. Conference and Exhibition on 3D Body Scanning and Processing Technologies, 25-26 Oct. 2022, Lugano, Switzerland
#41


---

 
 
2.1.8 Skeletal Landmarks 
Skeletal joint landmarks denoting body segments are common to standards simulating humanoids [9], 
discussing digital fittings [8], body measurements for apparel [3], and human dimensions for ergonomics 
[10]. Skeletal landmarks denote joints critical for movement considerations in both humanoid and 
coveroid. The humanoid must be provided a virtual skeleton (rig) directed by joints so human motion 
may be simulated.[11] Since coveroid geometry must provide movement allowance (ease) where bones 
meet and bend during motionjoint landmarks are as critical to the coveroid as humanoid. Indeed, these 
landmarks lay the foundation for humanoid-to-coveroid mapping practice. [12] (NOTE* citation relates 
to online studio access portion of textbook) 
 
2.1.9 Morphological Landmarks 
Morphological points denote surface anatomy known to identify uniqueness of human form within the 
body segments. For example, the bust and thigh landmarks identify uniqueness around which sizing 
systems are developed. Product specific landmarks, such as those required for an angled waist, [13] 
can also be referenced. 
 
2.1.10 Landmarks 
Landmarks rest as the foundation of any mapping system. Within the 3DBP ecosystem they rest as the 
base point of reference between the four assets. Technologies concerned with humanoid data some-
times refer to these points as feature points. Barring missing anatomy, landmarks identify reference 
points considered common to all humans. In physical environments landmarks are heuristically located 
using intuitive visual clues. In virtual environments algorithms are used to assign Cartesian coordinate 
points of reference: the x co-ordinate reference width points left to right (lateral or medial) on the body, 
the y co-ordinate reference height points from top to bottom (superior to inferior) on the body, and the 
z co-ordinate references depth points from front to back (anterior to posterior) on the body.  
 
2.1.11 Static Landmarks 
When observing the body in 4D (over time or through a range of movements) it is helpful to identify 
landmarks that will remain static. Due to the malleable nature of human flesh, no point can truly be 
considered static. 4D study in virtual environments, however, offers the opportunity for static surface 
(skin) landmarks to remain attached to the rigged skeleton for unique study of changes to human shape 
not practical in physical environments. Study here is ongoing. 
 
2.1.12 Split-Lines 
Split-lines connect landmarks as either lines or arcs to denote body segments as patch boundaries 
 
2.1.13 Humanoid as Coveroid 
A strong correlation exists between body segments and garment patterns but, the process of flattening 
a humanoid (UV unwrapping to create a 2D humanoid) for use as a coveroid has proven problematic. 
Technically, a humanoid provided split lines to denote patch boundaries can then be flattened to reveal 
an unassembled coveroid. While effective methods for flattening complex morphology exist, these 
methods do not adhere to foundational principles of garment pattern creation.[14] Consequently, utiliz-
ing the humanoid as coveroid has application limited to mainly molded product common with wearable 
products.  
2.1.14 - 3D Cross-Sectional Planes  
3D cross-sectional planes reveal girths and lengths from the 3D humanoid as planar volumes for a 
unique perspective not possible in physical practice. Usually, split lines will direct horizontal or vertical 
cross-sectional planes, but shaped planes are also possible. 
 
2.1.15 - 1D Dimensions 
In physical space practice measurements are retrieved with a tape-measure. These measurements, 
taken from a 3D body in both physical and virtual practice, are referred to as 1D dimensions. 
 
Proceedings of 3DBODY.TECH 2022 
13th Int. Conference and Exhibition on 3D Body Scanning and Processing Technologies, 25-26 Oct. 2022, Lugano, Switzerland
#41


---

 
 
2.1.16 - 3D Dimensions 
In virtual space practice measurements are retrieved from cross sectional planes revealing a 3D volu-
metric slice of the humanoid. 
 
2.1.17 - 2D Dimensions 
Equally important, and the reason a flattened humanoid cannot directly be used as a coveroid, are 2D 
dimensions. While there exists a strong correlation between 1D dimensions and 3D dimensions, this 
correlation does not hold true for 2D pattern dimensions. The reason for this is best explained with 
reference to 2D cube and sphere patterns. While the height of a cube pattern may quite simply be 
represented as four times the height of one side, the height of a sphere pattern is not so easily explained. 
Just as a sphere is a non-developable surface not easily translated to 2D dimensions so too are hu-
manoids considered non-developable. 
 
2.2. Covers and Coveroid Geometry 
2.2.1 Unassembled Cover or Coveroid 
While it is possible for covers to be manufactured as single piece molded products it is more common 
for products to consist of pieces which must be joined together. Therefore, both a cover and coveroid 
may exist in both an unassembled and assembled form. 
 
2.2.2 Pattern 
The unassembled cover or coveroid can be referred to as a pattern.  In most instances, the pattern is 
comprised of multiple pattern pieces. In physical space, the unassembled coveroid is cut from geometric 
shapes (templates) referred to as patterns. In digital space since material properties (colour, print, tex-
ture, physics of drape) may be applied directly to the pattern template piece(s), there is no distinction 
between the pattern and the unassembled coveroid. In digital space the pattern itself is an unassembled 
coveroid becoming an assembled cover or coveroid when the pattern pieces are joined (sewn or 
welded) to form a 3D object. In physical space, the template block is used to cut material shapes prior 
to joining. This additional step plus the use of materials makes sampling (see below) more economical 
in digital space. Patterns have a direct correlation to critical landmarks denoting body segments. 
 
2.2.3 Block 
The term block references a base pattern from which other patterns may be derived to create a hierar-
chy (see below) of patterns with the same established fit.  
 
2.2.4 Pattern-Engineering 
Pattern-engineering includes any practice related to the creating of cover or coveroid patterns, including 
draping, drafting, computer aided design (CAD), and grading. Sometimes referred to as pattern cutting, 
pattern creation, patternmaking, and pattern-drafting, here we have chosen the word pattern-engineer-
ing to respect the high degree of technicality 3D technologies bring to the craft of constructing patterns 
for coveroids and covers. 
 
2.2.5 Draping  
Draping is an artisanal heuristic technique using visual and tactile cues to form fabric to body. [12] 
Methods to replicate this practice in virtual environments are less tactile and more geometric than phys-
ical practice [15] but augmented reality environments could change this. 
 
2.2.6 Drafting  
Drafting uses principles of Euclidean geometry to map humanoid measurements to the unassembled 
coveroid pattern. 
 
Proceedings of 3DBODY.TECH 2022 
13th Int. Conference and Exhibition on 3D Body Scanning and Processing Technologies, 25-26 Oct. 2022, Lugano, Switzerland
#41


---

 
 
2.2.7 Computer Aided Design (CAD)  
CAD patternmaking takes place in a digital environment. In 3D-to-2D CAD environments a template 
block, or template block pieces, are virtually draped to a humanoid form. In 2D-to-3D CAD environments 
a template block is created using pattern drafting technique and then virtually sewn and wrapped around 
a humanoid for test fitting (sampling). [16] While any of the above techniques may be used repeatably 
for pattern creation, the reuse of garment patterns is a common shortcut. Any pattern created through 
the above methods may become a block and form the foundation for an extensive hierarchy of parent-
child family patterns. 
 
2.2.8 Grading and Parameterization 
Grading is an apparel specific parameterization process for resizing a base size cover or coveroid pat-
tern to create sizes both smaller and larger. [17] The process is directed by grade rules for the offsetting 
of pattern perimeter lines but darts, whether visible or hidden within pattern geometry, are not graded 
(see body-shape parameterization). Since shaping devices define body shape, the offsetting of perim-
eter lines effectively creates smaller and larger sizes of the same body-shape. The assumption with 
grading is that fit tolerance (see below) can be utilized to accommodate other body-shapes with similar 
humanoid data sets. A percentage of outlier body-shapes is expected. While machining industries pro-
vide example of the parameterization of complex shapes such methods lack applicability to apparel 
products [18] where fabric grain must be considered relative to individual morphology. Unique attributes 
of body-shape are often difficult to accommodate within the traditional grading process. Research to-
ward established practice for grading patch seamlines and darts specific to body shape are ongoing. 
[19]  Further, since garment design relies heavily on the manipulation of darts and seams, shaping 
devices are often hidden within garment pattern architecture and obscured from grading consideration. 
That patternmaking practice is founded on the categorization of humans into shape categories (e.g., 
infant, child, female adult, male adult) speaks to the inherent limitations within traditional CAD parame-
terization engines.   
 
2.2.9 Posture 
The effect of posture on 2D body-shape (as pattern geometry) is difficult to study in physical environ-
ments. Most covers and coveroids are suspended from the shoulders or hips, and therefore posture 
(e.g., the slope of the shoulders or angle of the pelvis) will affect the fit relationship between the cover 
and the human resulting in a balanced or unbalanced cover. While it has been demonstrated that pos-
ture effects measurements [20], study as to why continues. Dimensional change may possibly be at-
tributed to a change in shaping device requirements (body-shape) or attributed to functional ease re-
quirements. [21] Virtual environments will be pivotal toward further study. Cross-sectional analysis of 
planar girths in virtual environments permits a unique perspective of the body as a series of stacked 
planes for further study of the effects of posture and gravity on pattern geometry. 
 
2.2.10 Shaping Devices  
Shaping devices are seamlines and origami like folds (darting) added to garment patterns so cover and 
coveroid material may be shaped to human and humanoid form using the principles of fit (see below)[22].  
When a contoured fit is desired (no ease), shaping devices account for the dimensional variation be-
tween 1D and 2D dimensions which define 2D body-shape (see below). When creating blocks with 
ease, consideration for shaping devices directs the distribution of ease. Darts are internal lines indicat-
ing where internal dimension must be removed to mold material to morphology. [23] Seams reflect the 
boundaries of the pattern pieces which are inherently related to the split-lines connecting landmarks. 
Of importance to note, the precise location of shaping devices is dependent on practitioner preference. 
Consequently, two practitioners could achieve the same assembled coveroid geometry through varied 
application of darts and seams [24].  
 
2.2.11 Pattern Manipulation 
Maintaining the fit of the parent block through the building of pattern hierarchies is reliant on established 
practices for the manipulation of shaping devices. Seams may be eliminated by joining pattern pieces, 
created by adding new split-lines (see above) in the patterns, moved by removing dimensions from one 
pattern piece and adding it to another connecting piece, or changed by adding ease dimension. Darts 
Proceedings of 3DBODY.TECH 2022 
13th Int. Conference and Exhibition on 3D Body Scanning and Processing Technologies, 25-26 Oct. 2022, Lugano, Switzerland
#41


---

 
 
may be increased in size to remove dimension, decreased in size to add dimension, or manipulated 
and hidden with the style lines and pattern geometry. The hiding of darts within style lines is inhibitive 
to both parameterization and size selection applications.[25] 
 
2.2.12 Truing 
Truing is the process of smoothing lines and curves between critical landmarks. Traditional manual 
practice relies on heuristic technique utilizing rulers and French curves. By defining geometric relation-
ships [26] between patch boundaries (mathematical concepts of tangency and continuity) constrained 
splines can be derived to better define the mathematical relationship of the line or curve to surrounding 
pattern geometry. 
 
2.2.13 Pattern Hierarchies 
Base blocks are often referred to as parent blocks reflecting their infinite reuse within a family hierarchy: 
child, grandchild, great-grandchild etc. In general, a parent block (sometimes called a template block, 
block, sloper) defines a fit for a given style. For example, the template block for a tight-fitting jean and 
a pleated trouser would be very different. The parent blocks for the tight-fitting jean and pleated trouser 
could be used to derive multiple grandchild and great-grandchild blocks. In physical environments it is 
difficult to maintain the fit data established with the parent block through the reuse of patterns. In virtual 
environments, much opportunity exists to trace the original parent block fit through multiple pattern 
iterations. 
 
2.2.43 Principles of Fit 
Parent blocks, and derivative family block patterns, are developed using the established principles of fit 
[27] and/or numerous reinterpretations of these principles.[28] Using the principles of grain, set, line, 
and balance shaping devices are used to distribute ease suitable for a chosen style. Due to the 
complexities of fit and the dynamic nature of human form, it is highly likely compromise, directed by a 
cover’s primary function, will be required. For example, length ease required to bend over and touch 
one’s toes may appear excessive when standing but be required if a cover’s purpose is for a predomi-
nantly bent position. When making fit decision compromises, test fitting and sampling (see below) are 
integral the pattern-engineering process. 
 
2.2.15 Sampling 
Sampling refers to the process of testing the production process, product quality, and product fit. During 
the process of sampling a tech pack (see below) will be created, updated, and modified until a final 
design, material(s) choice, and process has been deemed suitable. 
 
2.2.16 Tech Pack 
Accompanying all unassembled coveroids is a set of instructions commonly referred to as a tech pack. 
Product dimensions and humanoid dimensions are an important component of the tech pack as these 
details are used for fit mapping and size selection. Tech pack data may also be linked to PLM (product 
life management) systems to direct ordering of product materials. (e.g., fabric, thread, interfacing, inter-
linings, linings, buttons, zippers, etc.) Ideally, the tech pack provides sufficient instruction for the unas-
sembled cover or coveroid such that it can direct identical product development at manufacturing facil-
ities of the same caliber. Since minor manufacturing error is expected, the tech pack also serves as 
guide to against which to gauge acceptable manufacturing fit tolerance (see above).  
 
2.3. Cover and Coveroid Sizing 
2.3.1 Key Measurements 
Key measurements identify dimensions of primary concern in cover or coveroid production, labelling 
and size selection.[29] Due to the complexity of human form, such measurements are often used within 
hierarchies for the sub-classification of human morphology suitable for product development. For ex-
ample, height is frequently used to sub-classify demographic data into age related categories of infant, 
toddler, child, youth, adult. A subsequent waist girth identifies change between sizes. Subsequent key 
measurements could be used to identify body-shape relevant to product. For example, a hip girth 
Proceedings of 3DBODY.TECH 2022 
13th Int. Conference and Exhibition on 3D Body Scanning and Processing Technologies, 25-26 Oct. 2022, Lugano, Switzerland
#41


---

 
 
indicates a drop value related to lower torso body-shape while an inseam length identifies torso and leg 
as ratios to height. Key measurements are most often related to skeletal landmarks (feature points)  
 
2.3.2 Fit Mapping 
Fit Mapping identifies a process used for grouping demographic data into sub-categories based on a 
desired incremental change of a key measurement (see above) and with close regard for a hierarchy 
of related body dimensions. It is used to initiate a sizing strategy, and then used in reverse to match 
human or humanoid body dimensions to cover or coveroid sizing. For example, age (baby, toddler, girls, 
boys, adult) and height (petite, regular, tall) are common first tier sub-categories. Due to the complexity 
of human form, further nested sub-categories to generalize fit areas of concern will be required to opti-
mize product development. For example, lower torso shape [30] may be used as sub-categories for fit 
mapping. Digital technologies have been pivotal in parsing complex interconnected factors affecting fit 
mapping with efforts for improved body-shape analysis ongoing. 
 
2.3.3 Sizing Systems 
Sizing Systems generate dimensional rules for covers and coveroids around key measurements and to 
accommodate common size groups highlighted with fit mapping. For example, a common key meas-
urement for North American blue jeans is the waist with an incremental change of 5cm (or 2 inches). 
The related hierarchy of body dimensions is age (adult), gender (male/female), height (petite/regu-
lar/tall), key or primary girth measurement (waist girth), secondary measurement (inseam), tertiary 
measurement (thigh girth). [29] Critical to any sizing system strategy are the rules for incremental 
change (grade rules or grading) which define individual sizes, connect them as a system and are used 
to link human and humanoid to cover and coveroid product. Grading is the heart of any sizing system. 
 
2.3.4 Fit Tolerance 
Fit tolerance may be considered from the perspective of an individual (individual fit tolerance), the 
perspective of a size category (size fit tolerance), or the perspective or affectable manufacturing error. 
In both instances 4D fittings are imperative. For example, a cover may have an intended fit of 10cm of 
hip ease but be considered suitable on humans with hips both 2.5cm smaller (where it would be slightly 
large) and larger (where if may be slightly small). Similarly, a cover constructed in stretch material can 
stretch less or more to respectively accommodate body-shape variation smaller or larger. Manufactur-
ing fit tolerance considers the degree to which an assembled cover may vary from sampled (see 
above) product specification. Tech packs, detailing assembled cover dimensions, play an integral role 
in assessing manufacturing fit tolerance Fit tolerance may be seen as in contrast to fit optimization and 
decisions must be made as to whether to compromise optimum fit against fit tolerance. 
 
2.3.5 Fit Intent 
Fit intent attempts to define a designer’s vision of the body-to-garment interaction. Material (most usu-
ally fabric) is a critical factor in this vision. Beyond this, words such as tight, semi-fitted, fitted, loose, 
relaxed, tailored etc. would be used to evoke an understanding of fit. Much effort has been directed at 
associating mathematical values to terms commonly used to define fit.[28] [31] Practice, however, con-
tinues to favour language suited to current trend over numerical fact. This non-qualitative approach to 
fit assessment may very well play a large role in garment returns as customers may have a differing 
opinion on the mathematical values associated with descriptors such as tight, fitted loose. It may also 
play a role in misapplication of machine learned fit preference leading to human dissatisfaction with 
customized product. 
 
2.4. Fit Assessment 
2.4 1 - 3D Fitting 
Since fitting refers to the process of trying on the cover or coveroid it is intrinsically linked to sampling. 
A 3D fitting transpires on a static humanoid. In physical practice, fit tolerance considerations are made 
when test-fitting a manufactured sample cover. In virtual practice, fit tolerance considerations can be 
made without the costs associated with physical sampling (material and production costs). Both physi-
cal and virtual space practice suffer from problems associated with fit validation where fit data can be 
Proceedings of 3DBODY.TECH 2022 
13th Int. Conference and Exhibition on 3D Body Scanning and Processing Technologies, 25-26 Oct. 2022, Lugano, Switzerland
#41


---

 
 
understood as geometric dimension against a baseline from which its accuracy can be understood. 
[32][33][34] 
 
2.4.2 - 4D Fitting 
Since a static humanoid does not adequately represent the dynamic nature of humans, 4D fittings tran-
spire on humanoids capable of movement through a range of movements. Such fittings. consider the 
fit of a garment over time and through a range of movements.[35] [36] For example, by testing the fit 
of pants in a seated as well as standing position. In physical space practice this can involve robotic 
dress forms or human fit models. To test individual fit tolerance, a coveroid must be tested on the 
same humanoid from which the 1D humanoid dimensions for coveroid generation were acquired. To 
test size fit tolerance, the fit model humanoids used for fit testing will have dimensional variation from 
the 1D humanoid data used for coveroid generation but would still fall within the same size category. In 
other words, the 2D pattern geometry representing shaping devices of the fit models would vary from 
the base size used for coveroid generation. 
 
2.4.3 - 1D Fit Assessment 
Traditional fit assessment practice has favoured 1D fit assessments comparing how 1D sizing system 
measurements vary from 1D human or humanoid measurements. Sizing system dimensions do not 
always have a direct correlation to garment (or garment pattern) dimensions. Hence, a 1D fit assess-
ment is suitable for narrowing scope of garment selection, but not effective for critical fit assessment 
decisions involving shaping devices. Nor for considering how wearer and brand fit preference may align. 
 
2.4.4 - 3D Fit Assessment 
Virtual approaches to fit assessment consider the interaction of body-to-garment as pressure on the 
humanoid by the coveroid, or as radial ease considering how and where the coveroid is offset from the 
humanoid. [37] Methods to translate this sensory data to pattern geometry as fit parameters are ongoing. 
For example, a high degree of pressure indicates zero to negative ease while minimal pressure indi-
cates positive ease. 
 
2.4.5 Sensory Fit Assessment 
A sensory fit assessment is a subjective assessment based on sensory response. Sensory fit considers 
a user’s, often subconscious, sensory response to a cover or coveroid. [38] Involving a multiplicity of 
constantly evolving decisions, strongly driven by seasonal trend, machine learning has been critical in 
collecting fit preference data (see below). 
 
2.4.6 Machine Learned (ML) Fit Assessment 
Machine learning has been pivotal toward collection of fit data, which is often linked to emotive, intuitive, 
responses. A machine learned (ML) fit assessment collects data regarding customer cover buying de-
cisions, aesthetic preference, and sensory preference, to predict future cover buying decisions and 
preference for fit utilizing computer algorithms. Such data is extremely useful for determining customer 
fit preference. Efforts for application of machine learned fit preference suitable for application to pro-
duction pattern are ongoing. 
 
2.4.7 - 2D Fit Assessment 
Any assessment regarding fit must speak to cover or coveroid geometric dimension for assigning of 
size or correcting of perceived fit. Therefore, regardless of fit assessment method used, acquired fit 
data must be translated to 2D geometric dimensions suitable for comparison to either the assembled 
or unassembled cover or coveroid. A 2D fit assessment may be accomplished heuristically (hand form-
ing material to body) or algorithmically (translating compression of radial ease to pattern geometry). To 
effectively change cover or coveroid fit, either a post-production alteration to the assembled cover, or a 
pre-production change to the unassembled cover or coveroid is required. Efforts are ongoing for auto-
mation to direct change at the developable garment pattern level for quantified fit and mass customiza-
tion of cover products. Effort toward translating acquired fit data to drive or alter pattern engineering 
process are ongoing. Where early methods failed to recognize established principles of fit or dart ma-
nipulation theory [39], apparel engineers building on this early work are making headway. [6] 
Proceedings of 3DBODY.TECH 2022 
13th Int. Conference and Exhibition on 3D Body Scanning and Processing Technologies, 25-26 Oct. 2022, Lugano, Switzerland
#41


---

 
 
3. Discussion 
Apparel digitization has been an arduous journey requiring the blending of artistic endeavor and engi-
neering. Language common to one end of the 3DBP ecosystem spectrum has been confusing to the 
opposing end. Considering the assets and transformations within the 3D body processing ecosystem 
and the fit terms discussed herein offers clarity toward understanding the data involved in any given fit 
situation.  
 
3.1. Considering the Future for Human and Humanoid Body Data 
The 3D humanoid data rests as the ground truth for body dimensions. Joint landmarks partition the 3D 
humanoid into segments related to apparel blocks and for the measuring of 1D humanoid dimensional 
data sets. 
 
From here coveroid development can be consider from posing the question ‘what modifications to hu-
man or humanoid dimensions can achieve the desired cover or coveroid outcome.’ Whilst fit is complex, 
it can be hypothesized that the human-to-cover relationship may be numerically expressed as a differ-
ence in dimensions between the cover and human, or coveroid and humanoid. How the variables of fit 
contribute to this is a matter for wider research, but a numeric value of difference is the hypothesized 
outcome to be operational in real or virtual environments. From this perspective the possibility for re-
verse engineering a cover or coveroid for mathematically quantified fit is presented and apparel fit chal-
lenges can be imagined from a perspective of computer architecture yet within the bounds of traditional 
artistic endeavour of cover design. 
 
Assuming the above, the first step is to ask, ‘what is added to the flattened 2D humanoid data to make 
it suitable as a developable coveroid pattern.’ These dimensions represent shaping devices. Combining 
1D humanoid data with shaping device data provides a unique opportunity for the possibility of quanti-
fying body-shape as 2D geometric dimension. 
 
3.2. Considering the Future for Cover and Coveroid Geometry 
Dimensions that vary from humanoid dimensions are considered ease.[40] Ease may be either negative 
(less than humanoid dimensions) or positive (more than humanoid dimensions). Negative ease com-
presses and redistributes body tissue. Positive ease creates an airgap between the human and cover 
or humanoid and coveroid.[28] In virtual environments, ease may be measured as compression ease 
(force exerted on body from fabric [41]) or radial ease (offset from body creating an airgap).  
 
Assuming the above hypothesis on body-shape has been established, we can now consider how ease 
is added to create to coveroid geometry. Since ease can be both negative and positive, negative ease 
could be accomplished through either the addition of a dart beyond those established as 2D body shape, 
or the application of negative geometry to a seam. Positive ease would be the inverse activity, releasing 
a dart for use as ease or the application of positive ease to a seam.  
 
3.3. Considering the Future for Cover and Coveroid Sizing  
Since current RTW offers adequate fit results utilizing mainly fit tolerance strategy, the opportunity for 
body-shape sizing combined with quantified fit tolerance strategy to radically improve RTW fit is very 
real. This is strongly supported by past study demonstrating the potential for improved fit with sizing 
aimed at specific body-shape categories.[19] This also offers much opportunity for the optimization of 
made-to-measure (MTM), a long sought-after goal of apparel digitization.  
 
3.4. Considering the Future for Fit Assessment 
Regardless of improved pattern-engineering practice size selection applications must be capable of 
matching consumer subjective opinion to objective geometric dimension. [42] Ultimately, this will mean 
delivering customer product which a brand’s fit algorithms have deemed unsuitable. Fit is and always 
will be subjective to the wearer, even if it can be objectively measured in manufacture. Assessing fit 
must reconcile how any given fit situation, even when quantified, may be assessed differently by wearer, 
observer, designer, and pattern-engineer. For such assessments to be made possible, measurable fit 
intent must become an integral part of the digital tech pack.  
 
Proceedings of 3DBODY.TECH 2022 
13th Int. Conference and Exhibition on 3D Body Scanning and Processing Technologies, 25-26 Oct. 2022, Lugano, Switzerland
#41


---

 
 
Within traditional apparel practice, the reuse of child patterns as template blocks creates a situation 
where a quantification of fit is difficult, if not impossible. Shaping devices, hidden within design lines and 
ease, are indeed in many cases unquantifiable without reference to the parent block. Within virtual 
environments, however, there exists much opportunity to maintain reference to the parent block. For 
example, if a decision were made to delegate all fit related decisions to the parent block, this fit data 
(quantified as geometric dimension) could be included as digital tech pack data passed to all pattern 
family iterations (child, grandchild, etc.). 
 
The evolution of the tech pack to be digitally linked to the coveroid offers the possibility to evolve fit 
intent for relevance as both artistic and mathematical descriptors of fit. If confirmed, the original goals 
of mass customization could be conceptualized as geometric pattern dimension comprised of fit prefer-
ence and body-shape data sets. Further study should test the possibility of quantifying body-shape as 
2D pattern geometry. 
4. Conclusion 
Here we have discussed terminology common to apparel fit practices within the framework of the 3DBP 
ecosystem. From this common ground the fit language is made accessible to the varied user base now 
involved in developing cover and coveroid products and the 3DBP technologies supporting this devel-
opment. Through this discussion, apparel fit challenges can be discussed relative to both physical and 
virtual space practice and suitable for both the perspective of the apparel practitioner (requiring subjec-
tive, heuristic, sensory processes) and the software architect (requiring objective, logical processes). 
From this clarity, a path forward for quantified apparel fit practice emerges and the adoption of 3DBP 
technologies can be considered from the perspective of matching application to required data sets. 
 
With the apparel industry transitioning from single use poor fitting garment purchase practice to “con-
scious consumerism,” expectations regarding fit will rise. Garments that fail to meet customer expecta-
tions regarding fit are returned. Returned garments defeat gains achieved with on-demand manufac-
turing. Fit strategies, affecting all consumer buying decisions could very well be the force making other 
sustainability initiatives viable. From both a conscious consumer and revenue optimization perspective 
quantified fit strategy is worthy of further study, seeing RTW, MTM, and bespoke as integral apparel 
offerings toward a more sustainable 3DBP apparel ecosystem. The success of these rest on the ability 
to use technologies to enhance the engineering of garments. 
 
5. References 
[1] 
W. Glascoe, J. Schulz, E. Scott, and C. Mcdonald, “IEEE 3D BODY PROCESSING INDUSTRY 
CONNECTIONS ASSETS AND TRANSFORMATIONS DEFINITIONS,” 2022. [Online]. 
Available: https://standards.ieee.org/about/bog/iccom/. 
[2] 
K. I. Norton, “Standards for Anthropometry Assessment,” Kinanthropometry Exerc. Physiol., pp. 
68–137, Sep. 2018, doi: 10.4324/9781315385662-4. 
[3] 
ISO, “8559-1:2017 - Size designation of clothes — Part 1: Anthropometric definitions for body 
measurement,” Iso 8559-1:2017. British Standards Institution, p. 80, 2017. 
[4] 
“ISO - ISO 7250-1:2017 - Basic human body measurements for technological design — Part 1: 
Body measurement definitions and landmarks.” https://www.iso.org/standard/65246.html 
(accessed Apr. 15, 2021). 
[5] 
“Process of Making Custom Made Suit. Korean Skilled Tailor - YouTube.” 
https://www.youtube.com/watch?v=2Xum875-rMY (accessed May 25, 2022). 
[6] 
A. R. G. Harwood, J. Gill, and S. Gill, “JBlockCreator: An open source, pattern drafting 
framework to facilitate the automated manufacture of made-to-measure clothing,” SoftwareX, 
vol. 11, no. December 2019, p. 100365, Jan. 2020, doi: 10.1016/j.softx.2019.100365. 
[7] 
S. Petrak, D. Rogale, and V. Mandekić-Botteri, “Systematic representation and application of a 
3D computer-aided garment construction method: Part II: Spatial transformation of 3D garment 
cut segments,” Int. J. Cloth. Sci. Technol., vol. 18, no. 3, pp. 188–199, 2006, doi: 
10.1108/09556220610657952. 
Proceedings of 3DBODY.TECH 2022 
13th Int. Conference and Exhibition on 3D Body Scanning and Processing Technologies, 25-26 Oct. 2022, Lugano, Switzerland
#41


---

 
 
[8] 
“ISO 18825-1:2016(en), Clothing — Digital fittings — Part 1: Vocabulary and terminology used 
for the virtual human body.” https://www.iso.org/obp/ui/#iso:std:iso:18825:-1:ed-1:v1:en 
(accessed Apr. 18, 2021). 
[9] 
“ISO - ISO/IEC 19774-1:2019 - Information technology — Computer graphics, image 
processing and environmental data representation — Part 1: Humanoid animation (HAnim) 
architecture.” https://www.iso.org/standard/64788.html (accessed Jul. 17, 2022). 
[10] 
“ISO - ISO 7250-3:2015 - Basic human body measurements for technological design — Part 3: 
Worldwide and regional design ranges for use in product standards.” 
https://www.iso.org/standard/64237.html (accessed Jul. 17, 2022). 
[11] 
N. Magnenat-Thalmann and D. Thalmann, “Handbook of virtual humans,” p. 443, 2004, 
Accessed: Jul. 17, 2022. [Online]. Available: 
https://books.google.com/books/about/Handbook_of_Virtual_Humans.html?id=HSfi4r2Gf9IC 
[12] 
S. Joseph-Armstrong, Helen, Ashdown, P., Draping for Apparel Design, 4th ed. Bloomsbury 
Publishing Plc, 2022. Accessed: Jul. 26, 2022. [Online]. Available: 
https://www.fairchildbooks.com/shop/draping-for-apparel-design-1 
[13] 
S. Morlock, A. Schenk, A. Klepser, and C. Loercher, “Sizing and fit for plus-size men and 
women wear,” in Anthropometry, Apparel Sizing and Design, 2nd ed., vol. 1980, Elsevier, 2020, 
pp. 371–406. doi: 10.1016/B978-0-08-102604-5.00014-7. 
[14] 
D. Gupta, “New directions in the field of anthropometry, sizing and clothing fit,” in 
Anthropometry, Apparel Sizing and Design, Elsevier, 2019, pp. 3–27. doi: 10.1016/B978-0-08-
102604-5.00001-9. 
[15] 
X. Tao and P. Bruniaux, “Toward advanced three-dimensional modeling of garment prototype 
from draping technique,” Int. J. Cloth. Sci. Technol., vol. 25, no. 4, pp. 266–283, Jul. 2013, doi: 
10.1108/09556221311326301. 
[16] 
A. S. M. Sayem, R. Kennon, and N. Clarke, “3D CAD systems for the clothing industry,” Int. J. 
Fash. Des. Technol. Educ., vol. 3, no. 2, pp. 45–53, 2010, doi: 10.1080/17543261003689888. 
[17] 
J. Price and B. Zamkoff, Grading techniques for fashion design, 2nd ed. NY: Fairchild, 1996. 
[18] 
E. Bye, K. LaBat, E. McKinney, and D. E. Kim, “Optimized pattern grading,” Int. J. Cloth. Sci. 
Technol., vol. 20, no. 2, pp. 79–92, 2008, doi: 10.1108/09556220810850469. 
[19] 
H. K. Song and S. P. Ashdown, “Development of Automated Custom-Made Pants Driven by 
Body Shape,” Cloth. Text. Res. J., vol. 30, no. 4, pp. 315–329, Oct. 2012, doi: 
10.1177/0887302X12462058. 
[20] 
S. Gill and C. J. Parker, “Scan posture definition and hip girth measurement: the impact on 
clothing design and body scanning,” Ergonomics, vol. 60, no. 8, pp. 1123–1136, Aug. 2017, 
doi: 10.1080/00140139.2016.1251621. 
[21] 
M. Ernst and U. Detering-Koll, “Posture Dependency of 3D-Body Scanning Data for a Virtual 
Product Development Process in Apparel Industry,” no. October, pp. 248–258, 2014, doi: 
10.15221/14.248. 
[22] 
F. Heisey, P. Brown, and R. F. Johnson, “Three-Dimensional Pattern Drafting Part 1: 
Projection,” Text. Res. J., vol. 60, no. 11, pp. 690–696, Nov. 1990, doi: 
10.1177/004051759006001110. 
[23] 
J. McCartney, B. K. Hinds, B. L. Seow, and D. Gong, “Dedicated 3D CAD for garment 
modelling,” J. Mater. Process. Technol., vol. 107, no. 1–3, pp. 31–36, 2000, doi: 
10.1016/S0924-0136(00)00695-6. 
[24] 
K. Brownbridge, S. Gill, and S. Ashdown, “Effectiveness of 3D Scanning in Establishing 
Sideseam Placement for Pattern Design,” Nov. 2013, pp. 41–49. doi: 10.15221/13.041. 
[25] 
H. Joseph-Armstrong, K. (Fashion I. Hagen, and V. J. (Technical I. Maruzzi, Patternmaking for 
fashion design. Pearson Education/Prentice Hall, 2010. 
[26] 
“Understanding Geometric Constraints - 2020 - DraftSight Help.” 
https://help.solidworks.com/2020/english/DraftSight/constraints/hlpid_constraints_geometric_ba
sics.htm (accessed Sep. 09, 2022). 
Proceedings of 3DBODY.TECH 2022 
13th Int. Conference and Exhibition on 3D Body Scanning and Processing Technologies, 25-26 Oct. 2022, Lugano, Switzerland
#41


---

 
 
[27] 
M. D. Erwin, L. A. Kinchen, and A. Peters, Kathleen, Clothing for Moderns. Macmillian 
Publishing Co. Inc. USA., 1979. 
[28] 
G. F. Zehner and B. Branch, “Manual for the Performance of Protective Equipment Fit-
Mapping,” Popul. (English Ed., 2010. 
[29] 
“ISO - ISO 8559-2:2017 - Size designation of clothes — Part 2: Primary and secondary 
dimension indicators.” https://www.iso.org/standard/64075.html (accessed Jul. 22, 2022). 
[30] 
Hwa Kyung Song and S. P. Ashdown, “Categorization of lower body shapes for adult females 
based on multiple view analysis,” Text. Res. J., vol. 81, no. 9, pp. 914–931, Jun. 2011, doi: 
10.1177/0040517510392448. 
[31] 
S. Gill and N. Chadwick, “Determination of ease allowances included in pattern construction 
methods,” Int. J. Fash. Des. Technol. Educ., vol. 2, no. 1, pp. 23–31, 2009, doi: 
10.1080/17543260903018990. 
[32] 
E. SCOTT and A. S. M. SAYEM, “Landmarking and Measuring for Critical Body Shape Analysis 
Targeting Garment Fit,” in Proceedings of 3DBODY.TECH 2018 - 9th International Conference 
and Exhibition on 3D Body Scanning and Processing Technologies, Lugano, Switzerland, 16-
17 Oct. 2018, Oct. 2018, pp. 222–235. doi: 10.15221/18.222. 
[33] 
E. Scott, S. Gill, and C. McDonald, “Novel Methods to Drive Pattern Engineering Through and 
For Enhanced Use of 3D Technologies,” 2019. 
[34] 
E. L. Scott, “The role of 3D measurement technology and anthropometric data for improved 
garment fit and sustainable manufacturing,” Digit. Manuf. Technol. Sustain. Anthr. Appar., pp. 
23–48, Jan. 2022, doi: 10.1016/B978-0-12-823969-8.00002-2. 
[35] 
S. Choi and S. p. Ashdown, “3D body scan analysis of dimensional change in lower body 
measurements for active body positions,” Text. Res. J., vol. 81, no. 1, pp. 81–93, 2011, doi: 
10.1177/0040517510377822. 
[36] 
S. Bogović, Z. Stjepanovič, A. Cupar, S. Jevšnik, B. Rogina-Car, and A. Rudolf, “The Use of 
New Technologies for the Development of Protective Clothing: Comparative Analysis of Body 
Dimensions of Static and Dynamic Postures and Its Application,” Autex Res. J., no. January, 
2018, doi: 10.1515/aut-2018-0059. 
[37] 
“ISO - ISO 18163:2016 - Clothing — Digital fittings — Vocabulary and terminology used for the 
virtual garment.” https://www.iso.org/standard/61644.html (accessed Jul. 23, 2022). 
[38] 
S. P. Ashdown and M. DeLong, “Perception testing of apparel ease variation,” Appl. Ergon., 
vol. 26, no. 1, pp. 47–54, 1995, doi: 10.1016/0003-6870(95)95750-T. 
[39] 
C. K. Au and Y.-S. Ma, “Garment pattern definition, development and application with 
associative feature approach,” Comput. Ind., vol. 61, no. 6, pp. 524–531, Aug. 2010, doi: 
10.1016/j.compind.2010.03.002. 
[40] 
S. Gill, “Improving garment fit and function through ease quantification,” J. Fash. Mark. Manag., 
vol. 15, no. 2, pp. 228–241, 2011, doi: 10.1108/13612021111132654. 
[41] 
K. Liu, X. Zeng, P. Bruniaux, J. Wang, E. Kamalha, and X. Tao, “Fit evaluation of virtual 
garment try-on by learning from digital pressure data,” Knowledge-Based Syst., vol. 133, no. 
July, pp. 174–182, 2017, doi: 10.1016/j.knosys.2017.07.007. 
[42] 
S. Guo and C. Istook, “Mass Customization : Perceptions of Related Technologies and 
Resulting Product,” pp. 12–14, 2017. 
 
Proceedings of 3DBODY.TECH 2022 
13th Int. Conference and Exhibition on 3D Body Scanning and Processing Technologies, 25-26 Oct. 2022, Lugano, Switzerland
#41
