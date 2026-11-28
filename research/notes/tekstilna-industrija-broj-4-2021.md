---
title: TEKSTILNA INDUSTRIJA · Broj 4 · 2021
id: tekstilna-industrija-broj-4-2021
tags:
- modelista-producao-moda-dores-0698af
- modelagem
- desenvolvimento-de-produto
created: '2026-11-27T02:25:07.101696Z'
updated: '2026-11-27T02:32:15.563260Z'
source: https://scindeks-clanci.ceon.rs/data/pdf/0040-2389/2021/0040-23892104072J.pdf
source_domain: scindeks-clanci.ceon.rs
fetched_at: '2026-11-27T02:25:07.100690Z'
fetch_provider: crawl4ai
status: draft
type: note
tier: institutional
content_type: paper
deprecated: false
summary: Jankoska (2021) evaluates 3D virtual fitting (CLO 3D) and 2D parametric patternmaking
  (Lectra Modaris, Müller method) for women's straight trousers (size 38, graded across
  10 sizes). Shows that 2D CAD pattern generation and grading rely heavily on case-sensitive
  patternmaker experience, whereas 3D simulation detects strain (up to 120% red distortion
  vs 114% yellow and 100% blue), stress, and pressure points across standing, moving,
  and sitting postures before physical sample sewing. Demonstrates that garments intended
  for sitting cannot be developed solely on standing avatars because knee construction
  lines, length, and hip/thigh circumferences shift significantly (reaching 120% distortion
  in hips and thighs when seated).
raw_file: raw/tekstilna-industrija-broj-4-2021.pdf
doi: 10.5937/tekstind2104072J
utility_score: 18.0
citation_count: 11
venue: Tekstilna industrija
is_retracted: false
---

72
TEKSTILNA INDUSTRIJA · Broj 4 · 2021
3D VIRTUAL FITTING SYSTEM 
ON WOMAN’S GARMENT
Maja Jankoska1
1 University “Ss. Cyril and Methodius” in Skopje, Faculty of Technology and Metallurgy,
  Department of Textile Engineering, North Macedonia
* e-mail: maja@tmf.ukim.edu.mk 
Abstract: Fit is one of the major concerns for the clothing industry, and pattern development process is signifi -
cant during clothing manufacturing and the way clothing is constructed. Various pattern making methods have 
been introduced to the industry considering clothing fi t satisfaction, but it is still impossible to provide the optimized 
clothing pattern for mass production. The aim of this paper is practical implications about 3D virtual fi t simulation 
technology as a fi t assessment tool in the fashion industry i.e. to predict the behavior of women’s pants in relation to 
fi tting and comfort in diff erent poses of avatar. This was done by application CAD Clo 3D fashion design software. 
Keywords: fi t, virtual garment, 3D garment simulation, apparel development.
3D VIRTUELNI SISTEM PRISTAJANJA ŽENSKE ODEĆE
Apstrakt: Fit ili pristajanje je jedna od glavnih briga za industriju odeć e, a proces razvoja šablona je značajan 
tokom proizvodnje odeć e i načina na koji se odeć a konstruiše. Različite metode izrade uzoraka su uvedene u indu-
striju s obzirom na zadovoljstvo pristajanja odeć e, ali je još uvek nemoguć e obezbediti optimizovani uzorak odeć e 
za masovnu proizvodnju. Cilj ovog rada su praktične implikacije o tehnologiji 3D virtuelne fi t simulacije  kao alata 
za procenu pristajanja u modnoj industriji, odnosno predviđanje ponašanje ženskih pantalona u odnosu na pri-
stajanje i udobnost u različitim pozama avatara. Ovo je izrađeno primenom CAD softvera modnog dizajna Clo 3D.
Ključne reči: fi t ili pristajanje, virtuelna odeć a, 3D simulacija odeć e, razvoj odeć e.
Professional paper
UDC: 687.2:004.94
doi: 10.5937/tekstind2104072J
1. INTRODUCTION
Early garment CAD focused on 2D pattern draft-
ing and modifi cation. The pattern-making techniques 
in 2D CAD systems mainly consist of two parts: (1) 
individual pattern generation based on parametric 
design; (2) individual pattern altering based on grad-
ing rules. Since garment is more fl exible than other 
industrial products, the constraint types used in both 
parametric design and the grading rules depend on 
pattern makers’ experience which is case-sensitive [1]. 
As a potential technical solution, 3D virtual fi t sim-
ulation technology has been introduced by the pres-
ent apparel industry as a progressive means of rapid 
prototyping [2].
This technology is capable of converting 2D pat-
terns into a fi nished sewn garment and placing it on 
a virtual fi t model which has the identical body shape 
and measurements of the target consumer group, 
based on designers’ input. This technology has the po-
tential to assist both designers and manufacturers in 
evaluating fi t and size issues quickly, using consistent 
virtual fi t models [3].
Although fi nal garment fi tting is mainly conduct-
ed with live models, during product development 
patternmakers and designers usually use dress forms 
because they have consistent measurements and are 
convenient to use [4].
While researchers have found varying levels of 
accuracy in 3D apparel simulation software it is chal-
lenging to generalize from these studies because of 
the variations in garment types, virtual fabric used, 
and approach to measuring accuracy [5-7]. Otieno 
and Apeagyei [5] looked at measurements of cross 


---

73
TEKSTILNA INDUSTRIJA · Broj 4 · 2021
sections of simulations to show similarities between 
the fi t of real and virtual garments. Wu et al. [6] com-
pared the fi t of simulated garments with the fi t of the 
same (actual) garments on a dress form, while Kim 
and Labat [7] compared real garments on live models 
with simulations on custom avatars. The important 
fi ndings in these studies relate to the factors that im-
pact accuracy of 3D garment simulation, rather than 
the accuracy itself.
Based on the feature-oriented parameterization 
of the human body, design-by-feature methodology 
[8,9] is applied to construct diverse feature-based pro-
fi le templates of garments, each of which represents 
a diff erent product styling of garment. The garment 
feature template is directly related to the feature 
graph of a parameterized human model by incorpo-
rating easing relationships [10]. When the body mod-
el is modifi ed by inputting sizing dimensions, the eas-
ing relationship will automatically rescale and fi t the 
garment product well on the individual body. Thus 
the diffi  cult, experience-based 2D grading problem is 
avoided in 3D garment CAD systems.
Researchers have estimated ease allowance used 
for pattern making and comfort evaluation. Garment 
shape and distance ease between body and garment 
depends not only on garment construction and body 
measurements, but also on structural and mechanical 
characteristics of textile materials [11-14]. According 
to Xu and Zhang [14], the main factors aff ecting the 
values of distance ease are bending, shearing, tensile 
deformation and overhanging factor of material. Fan 
et al. [15] and Chen et al. [16] also claimed that ease is 
dependent on many factors including fabric charac-
teristics, body movement, garment styling and com-
fort preferences.
3D simulation technology can reduce sample de-
velopment time, and save the cost of multiple itera-
tions of samples because the virtual fi tting can help 
to fi x the patterns through quick simulations of the fi t 
and real-time pattern change, before making actual 
samples [2,17,18].
Zhang et al. [19] present an intuitive method that 
seamlessly integrates the whole process of garment 
design including 3D modeling, pattern development, 
garment simulation, and grading. Shi et al. [20] pres-
ent an automatic virtual fi tting system for fi tting the 
input garment model onto the human model con-
structed from the input full-body image. Modeling 
virtual clothing where 2D and 3D digital technology 
is a modern tool is becoming a platform for the de-
sign, preparation and production of clothing. 3D vir-
tualized technology reduces the number of samples, 
creates effi  cient production, and makes quick deci-
sions, increases competitiveness, communication and 
e-sales [21].
In the previous work, fi rst a 2D pattern was made 
and then a 3D simulation of a men’s shirt [22]. The aim 
of this paper is to predict the behavior of women’s 
pants in relation to fi tting and comfort in diff erent po-
sitions of body movement and sitting. This was done 
application a 3D computer program. Size grading was 
also done.
2. EXPERIMENTAL 
The construction of women’s pants was made in a 
2D system. 3D women avatar of standard size 38 was 

Figure 1: 2D-to-3D transformation of pant


---

74
TEKSTILNA INDUSTRIJA · Broj 4 · 2021
covered with straight virtual pants stitched by Clo 
3D software, (Figure 1). First of all, parametric basic 
pattern of straight pants with all the required con-
struction ease allowances according to Müller pattern 
design method was drawn in Modaris software. Each 
line in basic construction was linked through formu-
las with the human body measurements and related 
ease allowance values. Later, without changing the 
measurements of the body, ten diff erent basic con-
structions of the pants were grading, (Figure 2). The 
pants are made of designed material.
Also this construction were used for virtual fi tting 
in order to determine the impact of diff erent poses of 
avatar on impact strain map, stress map and pressure 
map.
The triangular mesh is used to represent the initial 
surface and base surface of a garment and it is also 
used to represent the fi ne garment surface. To create 
a fi ne garment which is suitable for cloth simulation, 
2D patterns will be re-triangulated into regular mesh-
es and after triangulation; a 2D mesh can be automat-
ically mapped onto the 3D space [19]. However, if the 
boundary lines of a 2D pattern have been modifi ed, 
the 2D pattern cannot be mapped directly. Otherwise, 
gaps and overlaps will probably occur in the meshes 
of the resulting fi ne garment. After mapping refi ned 
meshes of 2D patterns onto actual fl attened 2D mesh-
es, we can easily calculate the corresponding 3D posi-
tions of the refi ned meshes, and then a fi ne garment 
with regular meshes will be obtained automatically, 
as shown in Figure 3. The shape of the fi ne garment 
is the same as the base garment surface with un-fl at-
tened regions being hidden. The main diff erence is 
that the fi ne garment is consisted of regular meshes. 
Consequently, distortion and fl ipping will probably 
happen in cloth simulation. 
3. RESULTS AND DISCUSSION
Findings of this study show that the current 3D vir-
tual fi t simulation technology is capable of converting 
2D patterns into 3D forms on an avatar and making a 
close visualisation of the main shape. This implies that 
technical designers can use the technology mainly 
for preliminary fi t analyses to check major fi t issues 
of overall length, width, and shape of the garment 
at the beginning of the prototyping. In addition, the 
tightness or looseness, length, and seamline of the 
garment were visible with the 3D virtual simulation 
technology. The fi t issues related to the paralleling 
and positioning of the seamlines and hem were easily 
recognised in the virtual garment. Also, our fi ndings 
showed that 3D virtual simulation technology is ca-
pable of visualising the main shape information of the 
simulated garments.
In a 3D computer-aided garment design system, 
triangulated cloth patterns are used and mapped 
onto a mannequin model by minimizing a quadratic 
energy function [23]. Aono et al. [24] gave a further 
study on the fi tting problem. In a versatile and effi  -
cient technique is proposed to simulate 3D dressing 
results from 2D pattern input [25]. Usually the 2D-to-
Figure 2: Grading 2D basic construction 
of woman‘s pants
Figure 3: Mesh mapping - original pattern


---

75
TEKSTILNA INDUSTRIJA · Broj 4 · 2021
3D transformation is treated as an elastic deformation 
process with large displacement but small stretch 
deformation. In a physical based deformable model is 
proposed for 2D-to-3D sewing and fi tting [26]. In this 
model, the cloth patterns are modeled by a triangular 
mesh composed of mass nodes and massless edges: 
edges works as springs. Both structural and shear 
springs are defi ned as shown in Figure 4.
Garment’s distortion rate due to external stress 
appears in percentage. Stain Map appears in total 
eight colors: Red indicates 120% of distortion rate 
while blue indicates 100% (no distortion). Numbers in 
between are expressed as gradation of two color. In 
addition to the strain map to determine the fi t of the 
pants there is also a stress map showing the external 
stress causing garment distortion per area of  the fab-
ric appears in the range of color and numbers and fi t 
map which shows the tightness of the 3D garment.
Figure 5 shows the virtual prototype on the front 
and back of the pants in standing pose of avatar be-
hind the displayed strain map. It can be concluded 
that in this standing position red color of distortion 
(120%) occurs in the center front and on a very small 
area in the waist, which can be concluded that the 
construction of the pants is good and will not have 
problems when trained in real wear for given dimen-
sions and target persons to wear. It can also be seen 
that there is a yellow color in the upper part of the 
pants, which indicates that the distortion is some-
what less present, which in percentage is somewhere 
around 114% on the scale. Where there is a blue color 
there is no distortion, and these are the length of the 
pants respectively.
In Figure 6, on the other hand, it can be seen that 
when the avatar is in the second standing position, 
the distortion increases to the hip side and in the seat 

Figure 5: Virtual prototypes of pants on a standing pose 3D body model
Figure 4: Virtual sewing and fi tting with 2D pattern input to 3D transformation


---

76
TEKSTILNA INDUSTRIJA · Broj 4 · 2021
sewn (red color) and little yellow color where the dis-
tortion is somewhat less, where in addition to the up-
per part of the trousers it also occurs in the knees.
When the position of the avatar changes to the 
third pose or moving pose, it is seen that the distor-
tion increases around the entire hips and back and 
thigh shown in Figure 7. That is, the situation is some-
what similar to Figure 6.
For developing pants for a sitting posture in a 
virtual environment, it is necessary to use a 3D body 
model in a sitting pose.
It is a fact that garments for a sitting posture can-
not be developed on a standing 3D body model, as 
there are diff erences in the position of the construc-
tion line of the knee, the length of the pants and the 
circumference of the pants around the hips and thighs, 
as can be seen in Figure 8. Based on that, as can be 
seen in Figure 8 in relation to strain maps where the 
greatest distortion of the pants is in the sitting posi-
tion, with the appearance of red in the area of  the hips 
and thighs, i.e. in these places there is 120% of distor-
tion. It can be assumed that, when using pants in real 
wear, distortion and discomfort could occur, another 
indicator that indicates how the pants would behave 
and whether something needs to be done in those 
parts, or add a little allowance to reduce this distor-
tion or correction in pattern making. In places where 
the yellow color occurs, there is a distortion of about 
114%, which means that it is somewhat smaller, but it 
is still present, and where there is a color from green 
to blue, there is 100% distortion or no distortion.
From all four avatar poses made, it can be con-
cluded that the distortion on this model of pants and 
the given dimensions occurs in fairly the same places 
on the avatar’s body, only the intensity is diff erent. So, 
when it is in a standing position, then the appearance 




Figure 6: Virtual prototypes of pants on 3D body model
Figure 7: Virtual prototypes of pants on a moving 3D body model


---

77
TEKSTILNA INDUSTRIJA · Broj 4 · 2021
of greater distortion, i.e. in red, there is little in certain 
places such as hips, seat sewn, thighs, and when the 
avatar is in a sitting position, and then the area of in-
creased distortion is larger.
Show pressure points are show or hide contact 
points between 3D garment and avatar, Figure 9.          
From Figure 9 (a, b, c) where the avatar is placed 
in multiple poses from standing, moving and sitting 
position it can be seen that the contact points of 3D 
garment and avatar are greatest in thighs and pants 
lengths on legs and back and less pronounced around 
waist. These pressure points show us how the pants 






Figure 8: Virtual prototypes of pants on a sitting 3D body model
a) standing poses of 3D avatar
b) moving pose of 3D avatar                                 c) sitting pose of 3D avatar
Figure 9: Pressure points - contact points between 3D garment and avatar


---

78
TEKSTILNA INDUSTRIJA · Broj 4 · 2021
would fi t the body depending on the chosen model 
and type of material, or whether the pants would be 
close to the body or not. Thus, before the start of tai-
loring, it will be known how the pants will behave in 
reality, i.e. whether what was needed according to the 
given model was obtained.
4. CONCLUSION
The research on 3D clothing simulation is boom-
ing. 3D cloth simulations are either geometrical based 
or physical based. Because of the contributions from 
the computer graphics community, the simulation 
accuracy and speed have been much improved in 
recent years. In the fi eld of clothing and textiles, 3D 
simulation is considered to be of great potential for fi t 
analysis, and a number of commercial clothing CAD 
systems have deployed 3D simulation modules. 
From the presented results it can be concluded 
that 3D clothing simulation with some diff erent poses 
of avatar can show what the fi nal model of women’s 
pants would look like for a certain target group for 
which they are intended, their fi tting as well as ma-
terial distortion and pressure, i.e. how much material 
will touch the body in real wear. Typically, a 3D virtual 
fi t model is fi rstly created and then the clothing pat-
terns are virtually sewn around the 3D model as if the 
garment were worn by the customer. The fi t model 
can be customised based on customers’ body dimen-
sions. It can be an excellent tool for clothing product 
development, because costly sample making and fi t-
ting process can be reduced or completely eliminat-
ed, suggested by the software suppliers. However, 
with the range of validity identifi ed, guidelines can 
be provided to the fashion industry for the use of 3D 
simulation system in design and fi t evaluation. There 
by 3D simulation can benefi t the industry by reducing 
cost and shortening development process.
REFERENCES
[1] Yang Y., Zhang W. (2007). Investigating the devel-
opment of digital patterns for customized apparel, 
International Journal of Clothing Science and Tech-
nology, 19(3-4),167-177.
[2] Park J., Kim D.E., Sohn M. (2011). 3D simulation 
technology as an eff ective instructional tool for 
enhancing spatial visualization skills in apparel de-
sign, International Journal of Technology and Design 
Education, 21(4), 505-517.
[3] Song H.K., Ashdown S.P. (2010). An exploratory 
study of the validity of visual fi t assessment from 
three-dimensional scans, Clothing and Textiles Re-
search Journal, 28(4), 263-278.
[4] Ancutiene K., Strazdiene E., Lekeckas K. (2013). 
Quality evaluation of the appearance of virtual 
close fi tting woven garments, The Journal of the 
Textile Institute, 105(3), 337-347.
[5] Otieno R., Apeagyei P.R. (2007). Usability of pat-
tern customizing technology in the achievement 
and testing of fi t for mass customization, Journal 
of Fashion Marketing and Management, 11(3), 349-
365.
[6] Wu Y.Y., Mok P.Y., Kwok Y.L., Fan, J.T., Xin, J.H. (2011). 
An investigation on the validity of 3D clothing sim-
ulation for garment fi t evaluation, Proceedings of 
the IMProVe, International conference on Innova-
tive Methods in Product Design, Venice, Italy, June 
15-17, 2011, p. 463-468.
[7] Kim D.D., Labat K. (2012). An exploratory study of 
the accuracy and fi delity of a three dimensional 
garment simulation, Textile Research Journal, 83(2), 
171-184.
[8] Case K., Gao J. (1993). Feature technology: an over-
view, International Journal of Computer Integrated 
Manufacturing, 6(1-2), 2-12.
[9] E. den Berg, Bronsvoort W.F., Vergeest J.S.M.  (2002). 
Freeform feature modelling: concepts and pros-
pects, Computers in Industry, 49(2), 217-233.
[10] Wang C.C.L., Wang Y., Yuen M.M.F. (2005). Design 
automation for customized apparel products, Com-
puter-Aided Design, 37(7), 675-691.
[11] Chan C.K., Jiang X.Y., Liew K.L., Chan L.K., Wong 
W.K., Lau M.P. (2006). Evaluation of  mechanical 
properties of uniform fabrics in garment manufac-
turing, Journal of Materials Processing Technology, 
174, 183-189.
[12] Rödel H., Schenk A., Herzberg C., Krzywinski, S. 
(2001). Links between design, pattern develop-
ment and fabric behaviours for clothes and techni-
cal textiles, International Journal of Clothing Science 
and Technology, 13, 217-227.
[13] Wang Z.H., Newton E. (2007). Modeling of 
cross-sectional shape for women’s jacket design, 
Sen’i Gakkaishi, 63, 87-96.
[14] Xu J., Zhang W. (2008). A study on impact factors 
of the distance eases between body and garment, 
Proceedings of Information Conference on Com-
puter-Aided Industrial Design and Conceptual De-
sign, pp. 201-205, Kunming.


---

79
TEKSTILNA INDUSTRIJA · Broj 4 · 2021
[15] Fan J., Yu W., Hunter L. (2004). Clothing appear-
ance and fi t, Science and technology, Cambridge: 
Woodhead.
[16] Chen Y., Zeng X., Happiette M., Bruniaux, P. (2008). 
A new method of ease allowance generation for 
personalization of garment design, International 
Journal of Clothing Science and Technology, 20, 161-
173.
[17] Sayem A.S.M., Kennon R., Clarke N. (2012). Resiza-
ble trouser template for virtual design and pattern 
fl attening, International Journal of Fashion Design, 
Technology and Education, 5(1), 55-65.
[18] Sul I.H. (2010). Style previewing in 3D using 
name-based sewing rules, International Journal of 
Clothing Science and Technology, 22(2/3), 127-144.
[19]  Zhang D., Liu Y., Wang J., Li J. (2018). An integrat-
ed method of 3D garment design, The Journal of the 
Textile Institute, 109(12), 1595-1605.
[20]  Shi G., Gao C., Wang D., Su Z. (2021). Automatic 
3D virtual fi tting system based on skeleton driving, 
The Visual Computer, 37, 1075-1088.
[21]  Paunović D. (2018). Modern 3D technologies 
in design of fashion products, Tekstilna Industrija, 
66(3), 13-17.
[22]  Jankoska M. (2020). Application CAD Methods in 
3D Clothing Design, Tekstilna Industrija, 68(4), 31-
37.
[23] Okabe H., Imaoka H., Tomiha T., Niwaya H. (1992). 
Three dimensional apparel CAD system, Computer 
Graphics, 26(2), 105-110.
[24] Aono M., Breen D.E., Wozny M.J. (1994). Fitting a 
woven-cloth to a curved surface: mapping algo-
rithms, Computer-Aided Design, 26(4), 278-292.
[25]  Decaudin P., Julius D., Wither J., Boissieux L., Shef-
fer A., Cani M.P. (2006). Virtual garments: a fully ge-
ometric approach for clothing design, Eurograph-
ics, 625-634.
[26] Fan J., Wang Q., Chen S.F, Yuen M.M.F., Chan C.C. 
(1998). A spring-mass model-based approach for 
warping cloth patterns on 3D objects, Journal of 
Visualization and Computer Animation, 9(4), 215-
227.
___________________ 
Primljeno/Received on: 2.11.2021.
Revidirano/ Revised on: 17.11.2021.
Prihvaćeno/Accepted on: 21.11.2021.
______________________________
© 2021 Authors. Published by Union of Textile 
Engineers and Technicians of Serbia. This article is an 
open access article distributed under the terms and 
conditions of the Creative Commons Attribution 4.0 
International license (CC BY) (https://creativecom-
mons.org/licenses/by/4.0/)
