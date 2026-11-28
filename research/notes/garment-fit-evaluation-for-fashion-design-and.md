---
title: Garment Fit Evaluation for Fashion Design and
id: garment-fit-evaluation-for-fashion-design-and
tags:
- estilista-producao-moda-8b096b
created: '2026-11-27T02:37:58.690717Z'
source: https://www.researchsquare.com/article/rs-1088025/latest.pdf
source_domain: www.researchsquare.com
fetched_at: '2026-11-27T02:37:58.688671Z'
fetch_provider: crawl4ai
status: draft
type: note
tier: institutional
content_type: paper
deprecated: false
raw_file: raw/garment-fit-evaluation-for-fashion-design-and.pdf
utility_score: 15.0
---

Garment Fit Evaluation for Fashion Design and
Manufacturing
Kaixuan Liu  (  liukaixuan819@163.com )
Ecole Nationale Superieure des Arts et Industries Textiles
Chun Zhu 
Xi’an Polytechnic University
Xianyi Zeng 
GEMTEX Laboratory, ENSAIT
Xuyuan Tao 
GEMTEX Laboratory, ENSAIT
Pascal Bruniaux 
GEMTEX Laboratory, ENSAIT
Jianping Wang 
Donghua University
Research Article
Keywords: Fit evaluation, clothing pressure, data learning, BP-ANNs, Random Forest, Bayesian classi¦er,
Discriminant Analysis, virtual try-on
Posted Date: November 30th, 2021
DOI: https://doi.org/10.21203/rs.3.rs-1088025/v1
License:   This work is licensed under a Creative Commons Attribution 4.0 International License.  
Read Full License


---

 
Garment fit evaluation for fashion design and manufacturing 
Kaixuan Liu1,2,3, Chun Zhu1,4, Xianyi Zeng3, Xuyuan Tao3, Pascal Bruniaux3, Jianping Wang4 
1Apparel and Art Design College, Xi’an Polytechnic University, Xi’an 710048, China 
2Shaanxi Key Laboratory of Intelligent Clothing Design, Xi’an Polytechnic University, Xian 
710048, China  
3GEMTEX Laboratory, ENSAIT, 59100 Roubaix, France 
4Fashion and Art Design Institute, Donghua University, Shanghai 200051, China 
 
Corresponding author: Kaixuan Liu 
Email: liukaixuan819@163.com  
Abstract 
Currently, garment fit evaluation is one of the biggest bottlenecks for fashion design 
and manufacturing. In this paper, we proposed a garment fit prediction model using 
data learning technology, such as Back Propagation Artificial Neural Networks 
(BP-ANNs), Random Forest, Bayesian Classifier. The inputs of the proposed model 
are digital clothing pressures measured by virtual try-on; while the output of the 
model is one of the three fit conditions- tight, fit or loose. In order to acquire reliable 
learning data, virtual and real try-on experiments were carried out to collect input and 
output learning data respectively. After learning from the collected input and output 
experimental data, the proposed model can predict garment fit rapidly and 
automatically by inputting digital clothing pressures measured by virtual try-on. Test 
results showed that the prediction accuracies of data-learning-based garment fit 
evaluation methods are much better than that of traditional methods.  
Key words:  
Fit evaluation; clothing pressure; data learning; BP-ANNs; Random Forest; Bayesian 
classifier; Discriminant Analysis; virtual try-on 
 
 


---

 
1.0 Introduction 
The issues of garment fit always run through the entire fashion design and 
manufacturing and sales [1, 2]. In fashion design process, designers and pattern 
makers need to evaluate garment fit for garment products optimization [3]. In the 
process of garment manufacturing, designers need to check whether the garment fits 
[1]. In garment retail filed, garment fit is the issue that consumers care most. No 
matter how beautiful garments are, how excellent fabrics are, customers still do not 
purchase the garments if they are unfit [1]. Currently, more and more people buy 
garments on line [4]; however, the bottleneck, how to evaluate garment fit, hampers 
the development of clothing e-business [5]. Researches showed that more than 50% 
customers are dissatisfaction with garment fit [6]. High prediction accuracy of 
garment fit evaluation can decrease the return and exchange ratio significantly. In 
physical stores, the customers can try on garments to check whether the selected 
garments are fit or not. Unlike the physical stores, garments bought on line cannot be 
tried on [7, 8]; thus, customers or sellers only evaluate garment fit roughly according 
to the previous experience. The experience-based evaluation results are neither 
accurate nor scientific. Therefore, how to predict garment fit without real try-on is one 
of main problems that must be solved for clothing industry. 
To solve the problem of garment fit evaluation, we should first understand what 
fit is. There are many factors influence garment fit; nevertheless, what is fit? Up to 
now, this concept has not been defined exactly. By summarizing fit definitions, 
clothing fit mainly includes two aspects: aesthetic fit and comfort fit. Comfort fit is 
mainly related to fabric materials and manufacturing processes, while aesthetic fit is 
mainly determined by fashion styles. Meanwhile the other design factors such as 
garment patterns, body dimensions influence either aesthetic fit or comfort fit [9-13]. 
In this research, we only study on the evaluation of the garment physiological fit. 
Specifically, the aspect of physiological fit is caused by garment size. 
Clothing tightness or looseness is the most intuitive manifestation of fit problem 
caused by size. Traditional garment fit evaluation includes fit evaluation by real and 
virtual try-on. In the aspect of real try-on, there are two methods to evaluate garment 
fit currently. One approach is trying on a dress form, and a designer evaluates whether 
the garment is fit or not according to his experience. The evaluation result depends on 
the designer’s level. Garment design process mainly adopts this way to evaluate 
garment fit. The other approach is trying on a live model, and the wearer directly 
evaluates the garment fit according to his feeling. Garment sales in physical shop 
mainly adopt this way to evaluate garment fit. As the evaluation result of this method 
is very accuracy, designers sometimes also adopt this way to evaluate garment fit. 
The biggest drawback of using real try-on to evaluate garment fit is the need to 
make real clothes. With the development of technology, the virtual try-on technology 
has been proposed to evaluate garment fit in a virtual environment. This technology 
simulates garment making process and uses garment patterns to model a 3D garment 


---

 
without making real garment [14-16]. A wearer can feel whether a garment is fit by 
real try-on; however, virtual try-on cannot [17]. Therefore, some supplementary 
means were proposed to evaluate garment fit of virtual try-on. At present, there are 
two methods to do so. One approach is that the visual evaluation carried out on a 3D 
garment by fashion designers [18, 19]. In actual operation, some experienced 
designers use pressure map, stress map and fit map generated by virtual try-on 
software for visual assessment of garment fit. However, these virtual try-on 
applications, are strongly dependent on mathematical models used in the software 
[20], cannot give high accurate garment fit evaluation. Obviously, the subjective 
visual evaluation is neither so accurate nor convincing. The other approach is to 
measure the ease allowances or air layer thickness, which are between the human 
body and the garment [21]. Then, evaluators analyze these measured indicators to 
evaluate garment fit based on their own empirical knowledge. 
Garment fit is influence by fashion style [13], garment pattern [22], body shape 
[23], body dimensions [9, 24, 25], fabric material [26], and so on. The traditional 
garment fit evaluation uses ease allowance or air layer thickness to evaluate garment 
fit. The ease allowance or air layer thickness can neither reflect the fitting feeling 
when it is less or equal to zero (tight garment style), nor does it take into account 
fabric properties. With the same value of ease allowance or air layer thickness, the 
fitting effects will be different if the fabrics are different. Evidently, ease allowance or 
air layer thickness only, is not enough for characterizing the fitting effects of a 
garment try-on. The real try-on can judge whether garment fit or not directly; however, 
the most disadvantage of this method requires people to participate physically in the 
evaluation process and making real garment. Due to the technical restrictions of real 
try-on related to real garment production and participation of suitable human subjects, 
the virtual try-on is proposed to evaluate garment fit. However, these virtual try-on 
applications, are strongly dependent on mathematical models used in the software 
[20], cannot give high accurate garment fit evaluation. Moreover, the visual 
evaluation of virtual try-on needs related empirical knowledge. This results in that the 
predicted results dependent entirely on subjective factors of designers, like experience, 
personal preference, etc. Obviously, the subjective visual evaluation is neither so 
accurate nor convincing. 
The emergence of artificial intelligence, data learning and mining technologies 
provides new approaches to solve the issues of garment fit evaluation. These 
technologies have been widely applied in the field of clothing and textile over last 
decade [27], such as, sensory evaluation of textile and related products [18, 28], 
garment fit and comfort prediction [1, 29], optimization of woven fabric parameters 
[30], size system [31, 32], intelligent systems of fashion design [33], garment 
production management [34]; apparel retail [35], clothing image recognition , and 
supply chain management [36]. Compared to classical methods, intelligent 
approaches are usually more capable of 1) solving nonlinear problems; 2) processing 
both numerical and linguistic attributes; 3) modeling human expert reasoning so as to 


---

 
produce correct and straightforward interpretation of results; and 4) computing with 
data of small quantity and without need of any preliminary or additional information 
like probabilistic distributions in statistics. Garment fit evaluation is a non-linear 
problem. Nonlinear models are widely used to solve the problems of prediction and 
evaluation in various industries . Due to these advantages of intelligent approaches, 
we propose to a data-learning-based method to evaluate garment fit. The aim of this 
research is to evaluate garment fit accurately without real try-on, and realize 
automatic and intelligent garment fit evaluation. Thus, clothing product developers or 
sales staffs can reduce the cost of product development or sales by reducing the 
number of real try-on.  
2.0 Methodology 
2.1 Input Learning Data Collection (Experiment I) 
We selected digital clothing pressures generated by virtual-try-on software as input 
items in the previous introduction. The concrete implement scheme of input learning 
data collection is indicated in Figure 1, Garments 𝑔1, 𝑔2, …, 𝑔𝑚, 𝑔𝑚+1,…, 𝑔𝑚+𝑛, 
𝑔𝑚+𝑛+1 ,…, 𝑔𝑚+𝑛+𝑠 were mapped respectively with 𝑘 measuring points. All 
garments’ digital clothing pressures were measured according to the 𝑘 measuring 
points.  For example, digital clothing pressures of garment 𝑗 were represented as 
𝑥𝑗
1, 𝑥𝑗
2, … , 𝑥𝑗
𝑘. Finally, we measured digital clothing pressures of garments 𝑔1 , 
𝑔2, …, 𝑔𝑚+𝑛. According to the result of Experiment I, the digital clothing pressure 
data PD was divided into three sets, 𝑝𝑓𝑖𝑡, 𝑝𝑡𝑖𝑔ℎ𝑡 and 𝑝𝑙𝑜𝑜𝑠𝑒.We used the three sets 
of data as input learning data to train the proposed model. 
Real body 
(customer)
Garment 
patterns
Parametric 
human body 
model
(a)
Adjusted 
human body 
model
(b)
Arrange patterns 
around the adjusted 
human body model
(e)
Virtual 
try-on
(f)
(d)
(c)
Digital clothing 
pressure 
measurement
(g)
Garment pattern 
database
Garment pattern 
database
Garment pattern 
database
 
Figure 1. Input learning data collection (digital clothing pressures). 
 


---

 
2.2 Output Learning Data Collection (Experiment II) 
For a reliable data, we collected output learning by real try-on. The concrete 
implementation scheme is as follows (Figure 2), wearers tried on all garments in the 
database. Finally, all the garments were divided into three categories: fit garments 
𝑔1, 𝑔2, … , 𝑔𝑚, 
tight 
garments 
𝑔𝑚+1, 𝑔𝑚+2, … , 𝑔𝑚+𝑛 and 
loose 
garment 
𝑔𝑚+𝑛+1, 𝑔𝑚+𝑛+2, … , 𝑔𝑚+𝑛+𝑠. Fit garments were labeled “1”, tight garments were 
labeled “2” and loose garments were labeled “3”. We used the data comprised of “1”, 
“2” and “3” as output learning data to train the proposed model. 
Fit, Tight or Loose
Loose garments database
Garment gm+n+1
Garment gm+n+2
...
Garment gm+n+s
Fit garments database
Garment g1
Garment g2
...
Garment gm
Garments database
Garment g1
Garment g2
...
Garment gn+m+s 
Tight garments 
database
Garment gm+1
Garment gm+2
...
Garment gm+n
Fit (1)
Loose(3)
Tight(2)
 
Figure 2. Output learning data collection. 
2.3 Model Relation Between Digital Clothing Pressures and Garment Fit Condition 
The concepts and data involved in this study are formalized as follows: 
Let 𝑛 be a number of nodes in input layers; 
Let 𝑙 be a number of nodes in hidden layers; 
Let 𝑚 be a number of nodes in output layers; 
Let 𝑤𝑖𝑗 be a linked weight between input layer and hidden layer; 
Let 𝑤𝑗𝑝 be a linked weight between hidden layer and output layer; 
Let 𝐻𝑗 be a set of hidden layer’s output vector; 
Let 𝑂𝑝 be a set of output layer’s output vector; 
Let 𝑋𝑖 be a set of input layer’s input vector, where, it refers tokdigital clothing 
pressures of garment i, which are measured by virtual try-on software; 
Let 𝑌𝑝 be a set of output layer’s desired output vector, where, it refers to 𝑚 
garment fit levels, which are measured by real try-on, such as, fit, loose, tight; 
Let 𝑎𝑗 be a set of hidden layer’s threshold; 
Let 𝑏𝑝 be a set of output layer’s threshold; 
Let 𝑒𝑝 be a set of networks prediction errors; 


---

 
Let 𝜂 be the learning rate; 
Let 𝑓(·) be the hidden layer’s activation function. 
As shown Figure 3, Back Propagation Artificial Neural Networks (BP-ANNs) is 
applied to model the relationship between digital clothing pressures and garment fit. 
The model learning with the BP-ANNs is composed of the following seven steps.  
Step 1 Networks initialization. Determining input layer node number n, hidden 
layer node number l, and output layer node number m according to input and output 
(𝑋𝑖, 𝑌𝑖). Initializing the hidden layer threshold 𝑎𝑗 and output layer threshold 𝑏𝑝. 
Given learning rate 𝜂 and neuron activation function 𝑓(·). 
Step 2 Hidden layer output calculation. Calculating the hidden layer output Hj 
according to input layer’s input vector 𝑋𝑖, input layer and hidden layers linked 
weights 𝑤𝑖𝑗 and hidden layer’s threshold aj. 
𝐻𝑖= 𝑓(∑𝑤𝑖𝑗
𝑛
𝑖=1
𝑥𝑖−𝑎𝑗) ,
𝑗= 1,2, … , 𝑙 
(5-1) 
Step 3 Output layer output calculation. Calculating BP-ANNs prediction output 
𝑂𝑝 according to hidden layer output 𝐻𝑗, hidden and output layers linked weights 𝑤𝑗𝑝 
and output layer’s threshold 𝑏𝑝.  
𝑂𝑝= ∑𝐻𝑗
𝑙
𝑗=1
𝑤𝑗𝑝−𝑏𝑝,
𝑝= 1,2, … , 𝑚 
(5-2) 
Step 4 Error calculation. Calculating networks prediction error 𝑒𝑝 according to 
output layer’s prediction output 𝑂𝑝 and output layer’s desired output 𝑌𝑝. 
𝑒𝑝= 𝑌𝑝−𝑂𝑝,
𝑝= 1,2, … , 𝑚 
(5-3) 
Step 5 Weight updating. Updating BP-ANNs connection weights 𝑤𝑖𝑗 and 𝑤𝑗𝑝 
according to networks prediction error 𝑒𝑝. 
𝑤𝑖𝑗 = 𝑤𝑖𝑗+ 𝜂𝐻𝑗(1 −𝐻𝑗)𝑥(𝑖) ∑𝑒𝑝
𝑚
𝑝=1
𝑤𝑗𝑝,
𝑖= 1,2, … , 𝑛; 𝑗= 1,2, … , 𝑙 
(5-4) 
𝑤𝑗𝑝 = 𝑤𝑗𝑝+ 𝜂𝐻𝑗𝑒𝑝,
𝑗= 1,2, … , 𝑙; 𝑝= 1,2, … , 𝑚 
(5-5) 
Step 6 Threshold updating. Updating BP-ANNs node threshold 𝑎𝑗 and 𝑏𝑝 
according to networks prediction error 𝑒𝑝. 
𝑎𝑗 = 𝑎𝑗  + 𝜂𝐻𝑗(1 −𝐻𝑗) ∑𝑒𝑝
𝑚
𝑘=1
𝑤𝑗𝑝,
𝑗= 1,2, … , 𝑙 
(5-6) 
𝑏𝑝 = 𝑏𝑝+ 𝑒𝑝,
𝑝= 1,2, … , 𝑚 
(5-7) 
Step 7 Testing whether algorithm iteration is over. If the error meets the 
presupposed precision or learning times are greater than the predefined maximum, 
then the algorithm is stopped. Otherwise, inputting next learning sample and the 
corresponding output expected values; then returning to step 2 and into the next round 
learning. 


---

 
Using the steps above, we construct a garment fit evaluation model based on 
BP-ANNs. The input items of the proposed model are digital clothing pressures and 
the output items of that are garment fit conditions (fit, loose, and tight). Through 
learning from experimental data collected by real and virtual try-on, the proposed 
model can automatically predict garment fit without any real try-on. 
Input
output
Hidden layer
. . .
. . .
Output layer
. . .
. . .
Input layer
Error calculation
Error propagation 
neurons
neurons
neurons
neurons
Digital clothing 
pressures
Garment fit condition: 
fit, tight or loose
 
Figure 3. Structure of Back Propagation Artificial Neural Networks (BP-ANNs). 
3.0 Validation 
In section II, we used neural networks to construct an intelligent model of garment fit 
evaluation. In this section, we introduce how to validate the model’s prediction 
accuracy.  
3.1 Bp-Anns Parameters Setting, Training and Prediction 
Networks layer setting: It has been proved that any continuous function can be 
uniformly approximated by a BP networks  model with only one hidden layer [37]. 
As our problem is rather simple (20 inputs, 1 output and nonlinear continuous 
relationship), the BP-ANNs with three layers is adapted to modeling of the relation 
between digital clothing pressures and garment fit.  
Input and output layer nodes selections: The input layer is the link between the 
external signal and the BP neural networks. The number of its nodes depends on the 
dimensions of the learning input data. The number of nodes at the output layer varies 
with application. If the networks act as a classifier, the number of nodes at the output 
layer equals the number of predefined classes or categories. In our research, the nodes 
at the input layer are the k digital clothing pressures while the output is the 
unidimensional garment fit level. 
Hidden layer setting: The number of neurons at the hidden layer has a significant 
effect on the BP-ANNs prediction accuracy. If this number is too small, the ability of 
learning from data in the networks will be decreased, leading to the convergence to a 
local optimum. If this number is too large, the phenomenon of over-fitting will occur, 
leading to a longer time of learning and arbitrary errors. Up to now, no systematic 
rules or equations exist allowing calculation of the optimal number of hidden neurons 


---

 
[37].  In general applications, this number is selected by trial and error. In our study, 
the number of neurons in the hidden layer is determined using a frequently used 
empirical formula. Its value is 10.  
Learning rate: Learning rate has an important effect on the performance of the 
BP neural networks. If it is too small, the number of training iterations will be 
increased and more time will be needed. If it is too large, the networks can learn 
quickly, but easily lead to a wrong convergence. After a number of tests on the BP 
learning algorithm with different values, I finally set the learning rate to 0.03 and the 
number of training iterations to 500. 
BP-ANNs training [38]:Actually, BP-ANNs training process is a process for the 
connection weights adjustment. It mainly contains the following nine stages. 1) 
Initialize of the connection weights of the networks ; 2) Select a sample from the 
training dataset as the input of the networks ; 3) Calculate the output value of the 
networks ; 4) Calculate the error of the networks output related to the real value; 5) 
Adjust the connection weights by using the feedback from the output layer to the 
input layer; 6) Repeat Steps 3), 4) and 5) until the error is acceptable; 7) Select 
another sample of the training set data and repeat the above steps until the 
convergence of the algorithm.  
BP-ANNs prediction: After identifying the connection weights by the previous 
training step, the proposed model in Figure 3 can be used to predict garment fit level 
by inputting the measured digital clothing pressures of a new garment. 
3.2 Learning Data Collection and Garment Fit Evaluation Model Training 
According to the method of input learning data collection (Experiment I), we used a 
measurement method, which were used in our previous researches [14, 15], to acquire 
digital clothing pressures. As shown in Figure 4, firstly, measuring points F1, F2, …, 
F15 and B1, B2, …, B5 were equally mapped on front and back pieces of the pants’ 
patterns respectively (Note: the ‘parts below knee have little effect on clothing fit; 
therefore, we did not map measuring points on these parts); secondly, we used CLO 
3D Modelist software to try the patterns on a parametric human model, whose body 
dimensions were equal to the real body dimensions; finally, we measured digital 
clothing pressures of 72 pairs of pants according to the 20 predefined points. The 
collected data of digital clothing pressures was as the input learning and test data used 
for model construction and validation.  
According to the method of output learning data collection (Experiment II), 72 
pairs of pants were evaluated by real try-on. We defined fit, tight and loosed as 
follows: If a wearer feels neither tight nor loose in each part of a garment, the garment 
is considered fit for the wearer; If a wearer feels tight in one place of a garment; the 
garment is considered tight for the wearer; If a wearer feels loose in one place of a 
garment, the garment is considered loose for the wearer. We labeled fit garments with 
“1”, tight garments with “2” and loose garments with “3”. The data containing “1”, “2” 


---

 
and “3” was as the output learning and test data to construct and validate our proposed 
model.  
 
Figure 4. Measurement method of digital clothing pressures by virtual try-on. 
Table 1. Digital clothing pressures data collected by virtual try-on (input learning and 
test data) and garment fit condition data collected by real try-on (output learning and 
test data). 
Data name 
SNN 
Fit Level 
Digital 
clothing 
pressures 
(unit: 
virtual Kpa). 
𝑭𝟏 
𝑭𝟐 
… 
𝑩𝟓 
𝑃𝐷 
𝑝𝑓𝑖𝑡 
1 
1 
6.70 
10.25 
… 
13.71 
2 
1 
3.75 
6.49 
… 
2.72 
⋮ 
⋮ 
⋮ 
⋮ 
⋮ 
⋮ 
23 
1 
8.26 
11.51 
… 
7.43 
𝑝𝑡𝑖𝑔ℎ𝑡 
24 
25 
2 
2 
12.40 
19.81 
17.45 
28.33 
… 
… 
9.32 
16.21 
⋮ 
⋮ 
⋮ 
⋮ 
⋮ 
⋮ 
47 
2 
17.2 
22.37 
… 
12.74 
𝑝𝑙𝑜𝑜𝑠𝑒 
48 
3 
6.92 
9.57 
… 
1.67 
49 
3 
14.59 
16.56 
 
0.58 
⋮ 
⋮ 
⋮ 
⋮ 
⋮ 
⋮ 
72 
3 
7.58 
9.12 
… 
0.47 
Note: PD is Pressure Data; SSN is sample sequence number; 𝐹1, 𝐹2, 𝐹3, 𝐹4, …, 𝐵5 
are measuring points of digital clothing pressures, please see Figure 4 (a). 
Finally, the input and output data were combined together. As shown in Table 1, 
all the fit pants and their corresponding digital clothing pressures were integrated into 


---

 
a data 𝑝𝑓𝑖𝑡; all the tight pants and their corresponding digital clothing pressures were 
integrated into a data 𝑝𝑡𝑖𝑔ℎ𝑡; and all the loose pants and their corresponding digital 
clothing pressures were integrated into a data 𝑝𝑙𝑜𝑜𝑠𝑒. Data 𝑝𝑓𝑖𝑡, 𝑝𝑡𝑖𝑔ℎ𝑡 and 𝑝𝑙𝑜𝑜𝑠𝑒 
were divided into two parts. One part was use for model learning and the other part 
was used for the validation of model prediction accuracy. 
Several surveys have shown consumer dissatisfaction with garment fit recorded 
to be more than 50% [6, 39]. Often, garment fit is already evaluated before the 
garment is sold. This information above indicates that the evaluation accuracy of 
traditional garment fit evaluation methods is obviously lower 50%. To compare with 
other data learning algorithms, we also calculated the prediction accuracy of garment 
fit evaluation based on other data learning algorithms, random forest, Bayesian 
classifier, discriminant analysis, etc. Because random forest has the merit of 
non-aggravating the overfitting of data as the number of trees increases [40]. As the 
number of the training sample is less, it is necessary to do a comparison with other 
algorithms for avoiding over-fitting phenomenon.  
3.3 Garment Fit Evaluation Model’s Prediction Accuracy Calculation 
The validation flowchart is shown in Figure 5. The data collected in Experiment I and 
II were divided into training data and testing data. Firstly, we used the training data to 
train our proposed BP-ANNs based fit evaluation model. That is to adjust the weights 
of neural networks. After learning from training data, the test data is used for 
validating the model’s prediction accuracy.  
 
Figure 5. The flow chart of model’s prediction accuracy validation. 
In order to obtain more reasonable validation result, we use the K-fold 
cross-validation to test the approach by calculating the prediction accuracies of the 
proposed models. The principle of K-fold cross validation is introduced as follows. 
The data set is divided into 𝑘 subsets, and the holdout method is repeated 𝑘 times. 
Each time, one of the 𝑘 subsets is used as the test set and the other 𝑘-1 subsets are 


---

 
put together to form a training set. Then the average error across all 𝑘 trials is 
computed. The advantage of this method is that it matters less how the data gets 
divided. Every data point gets to be in a test set exactly once, and gets to be in a 
training set 𝑘-1 times. The variance of the resulting estimate is reduced as k is 
increased. 
The test results of K-fold cross validation show that the prediction accuracies of 
BP-ANNs-based garment fit evaluation method is the highest, followed by Random 
Forest, Bayesian Classifier, and the worst is Discriminant Analysis. Specially, the 
prediction accuracies of machine-learning-based garment fit evaluation methods are 
all significantly higher than that of traditional method by real try-on (Error! 
Reference source not found.). This indicates that data-learning-based garment fit 
evaluation methods is better than traditional method. 
Table 2. Comparison of prediction accuracy between BP-ANNs, random forest and 
traditional fit evaluation method by real try-on. 
Prediction methods 
Prediction Accuracy 
Fit evaluation method based on BP-ANNs 
93% 
Fit evaluation method based on Random Forest 
83% 
Fit evaluation method based on Bayesian Classifier 
81% 
Fit evaluation method based on Discriminant Analysis 
78% 
Traditional fit evaluation method by real try-on 
Less than 50% 
Note: In the training process, the number of the hidden layer nodes is 10, and the 
number of trees of the Random Forest is 50. Prediction Accuracy is the average of 10 
K-fold cross validations (K=10). 
4.0 Application 
Virtual try-on
Adjust
Measure
Choose
Satisfy
Unsatisfy
Measure 
clothing 
pressure
production
Customer
Digital human 
model
Body 
dimensions
Garment pattern
Satisfy 
or not
Garment style
Fit evaluation model based on 
our proposed method
Input
Clothing pressure CP1
Clothing pressure CP1
...
Clothing pressure CPk
Trained fit prediction model
Fit prediction model based 
on BP-ANN 
Output
Fit，tight or 
loose
Modification
 
Figure 6. Garment fit prediction for manufacturing. 


---

 
Fit evaluation is an important link in clothing product development and sales. In this 
section, we gave an application to evaluate garment fit using our proposed method for 
garment e-shopping. As shown in Figure 6, a customer chooses a garment in a 
garment online shopping store; according to the customer’s body dimensions, we 
adjust the 3D parametric mannequin; then we find the selected garment’s patterns 
from pattern databased, and try the patterns on the adjusted 3D parametric mannequin; 
next, we measure digital clothing pressures and input the pressures into our proposed 
model; the model predicts garment fit automatically finally. If the customer satisfies 
with the garment fit condition predicted by our proposed method, we recommend the 
customer to buy it. Otherwise, we change a new size to predict its fit until the 
customer satisfy. 
5.0 Discussion 
The traditional garment fit evaluation methods require customers having a real try-on; 
it leads to high garment manufacturing costs. Therefore, we proposed a 
data-learning-based method to predict garment fit. In this model, the digital clothing 
pressure data collected by virtual try and garment fit condition data collected by real 
try-on have mapping relationships. Even though some differences between virtual and 
real clothing pressures exist, the reliability of the proposed model is unaffected. The 
main contributing factor on the reliability of the proposed model is the outputting data 
collected by real try-on. Therefore, real try-on is very important for output data 
collection. As the proposed model learns from the experimental data collected by real 
try-on, the prediction accuracy is reliable. 
In our previous studies, we used Bayesian classifiers to predict garment fit [1]. 
The garment fits were divided into fit and unfit. However, the two fit levels are too 
simplified. Clothes that are too loose or too tight can lead to unfit. In order to evaluate 
fit more accurately, we divided garment fit into three levels: fit, tight and loose in this 
research. Although, our proposed method is better than traditional method by real 
try-on to evaluate garment fit. There are still some shortcomings needed to improve. 
For example, the overall feel of a garment is loose, but some parts may be tight or fit; 
for the same reason, the overall feel of a garment is tight, but some parts may be loose 
or fit. Due to the current classification of garment fit condition is still simple, garment 
fit conditions can be divided into more categories in the future research, such as waist 
part’s fit condition, hip part’s fit condition, crotch part’s fit condition. For garment 
e-shopping, our proposed method requires customers providing their body dimensions. 
With the advent of 3D body scanner, body dimensions can be measured automatically 
and rapidly using this device. The 3D body scanner can not only measure body 
dimensions, but also acquire human body’s point cloud data. 3D human model 
constructed based on the point cloud is more accurate than body dimensions. 
Therefore, combining 3D body scanning technology, the fit evaluation methods based 
on data learning technology could predict garment fit more accurately.  


---

 
Although our method has many advantages, it also has some shortcomings. One 
of the biggest limitations of our proposed method is that, for another type of garment, 
the proposed model should be re-trained. 
6.0 Conclusion 
In this paper, we proposed a data-learning-based garment fitting prediction model. 
The result indicates that data-learning-based garment fit evaluation methods are much 
better than traditional method by real try-on. Compared with traditional garment fit 
evaluation methods, the advantage of our approach is: 1) It excludes physical 
participation of customers; 2) The prediction accuracy of BP-ANNs-based garment fit 
evaluation method is not only better than that of Random Forest, Bayesian Classifier, 
Discriminant Analysis based methods, but also significantly higher than that of 
traditional method’; 3) It is not only suitable for garment e-shopping, but also for 
garment products development. 
In practice, the greatest contribution of our method is to realize automatic and 
intelligent garment fit evaluation. Our proposed method can significantly reduce the 
number of sample-making and real try-on in the process of apparel product 
development, thereby reducing the cost of apparel product development. Further 
research can be conducted from two aspects: 1) Validating the prediction accuracy of 
the proposed method under the condition of increasing the number of garment fit 
conditions; 2) Combining 3D body scanning technology, to extend application range 
of the data-learning-based garment fit evaluation.  
Funding 
The work was financially supported by The National Natural Science Foundation of 
China, China (No. 61806161), China National Endowment for the Arts, China (No. 
2018-A-05-(263)-0928), Social Science Fund Project of Shaanxi Province, China (No. 
2018K32), Natural Science Basic Research Program of Shaanxi Province, China (No. 
2019JQ-848), Innovation ability support plan of Shaanxi Province-young science and 
Technology Star Project, China (No. 2020KJXX-083), and The Youth Innovation 
Team of Shaanxi Universities, China (No. 21JP048). 
Data availability  
All data generated or analyzed during this study are included in this published article. 
Code availability 
Not applicable. 


---

 
Ethics approval and consent to participate  
Not applicable.  
Consent to participate 
All authors have read and agreed to participate. 
Consent for publication  
All authors have read and agreed to publish the manuscript.  
Competing interests  
The authors declare no competing interests. 
Author contributions  
All authors contribute equally. 
References 
1. 
Liu K, Zeng X, Bruniaux P, Wang J, Kamalha E, Tao X. Fit evaluation of virtual 
garment try-on by learning from digital pressure data. Knowl-Based Syst. 
2017;133:174-82. doi: https://doi.org/10.1016/j.knosys.2017.07.007. 
2. 
Liu K, Wang J, Hong Y. Wearing comfort analysis from aspect of numerical 
garment pressure using 3D virtual-reality and data mining technology. Int J Cloth 
Sci 
Technol. 
2017;29(2):166-79. 
doi: 
http://dx.doi.org/10.1108/IJCST-03-2016-0017. 
3. 
Tao X, Chen X, Zeng X, Koehl L. A customized garment collaborative design 
process by using virtual reality and sensory evaluation on garment fit. Computers 
& 
Industrial 
Engineering. 
2018;115:683-95. 
doi: 
https://doi.org/10.1016/j.cie.2017.10.023. 
4. 
Song HK, Ashdown SP. Female Apparel Consumers' Understanding of Body 
Size and Shape: Relationship Among Body Measurements, Fit Satisfaction, and 
Body 
Cathexis. 
Cloth 
& 
Textiles 
Res 
J. 
2013;31(3):143-56. 
doi: 
http://dx.doi.org/10.1177/0887302x13493127. 
5. 
Kim H, Damhorst ML. The Relationship of Body-Related Self-Discrepancy to 
Body Dissatisfaction, Apparel Involvement, Concerns With Fit and Size of 
Garments, and Purchase Intentions in Online Apparel Shopping. Cloth & 
Textiles 
Res 
J. 
2010;28(4):239-54. 
doi: 
http://dx.doi.org/10.1177/0887302x10379266. 


---

 
6. 
Ashdown SP, Dunne L. A study of automated custom fit: Readiness of the 
technology for the apparel industry. Cloth & Textiles Res J. 2006;24(2):121-36. 
doi: https://doi.org/10.1177/0887302X0602400206. 
7. 
Forsythe S, Liu C, Shannon D, Gardner LC. Development of a scale to measure 
the perceived benefits and risks of online shopping. J Interact Mark. 
2006;20(2):55-75. doi: http://dx.doi.org/10.1002/dir.20061. 
8. 
Cases A-S. Perceived risk and risk-reduction strategies in Internet shopping. Int 
Rev of Retail, Distribution and Consumer Research. 2002;12(4):375-94. doi: 
http://dx.doi.org/10.1080/09593960210151162. 
9. 
Liu K, Wang J, Kamalha E, Li V, Zeng X. Construction of a body dimensions' 
prediction model for garment pattern making based on anthropometric data 
learning. 
J 
Text 
Inst. 
2017;108(12):2107-14. 
doi: 
http://dx.doi.org/10.1080/00405000.2017.1315794. 
10. Liu K, Wang J, Zeng X, Tao X, Bruniaux P, Edwin K. Fuzzy classification of 
young women's lower body based on anthropometric measurement. Int J Ind 
Ergonom. 2016;55(5):60-8. doi: http://dx.doi.org/10.1016/j.ergon.2016.07.008. 
11. Liu K, Zhu C, Tao X, Bruniaux P, Zeng X. Parametric design of garment pattern 
based on body dimensions. Int J Ind Ergonom. 2019;72:212-21. doi: 
https://doi.org/10.1016/j.ergon.2019.05.012. 
12. Liu K, Zhang L, Zhu C, Zhao X, Lu W, Li M, et al. An analysis of influence 
factors of sports bra comfort evaluation based on different sizes. J Text Inst. 
2019;110:1792-9. doi: https://doi.org/10.1080/00405000.2019.1620513. 
13. Liu K, Zeng X, Tao X, Bruniaux P. Associate Design of Fashion Sketch and 
Pattern. 
IEEE 
Access. 
2019;7:48830 
- 
7. 
doi: 
https://doi.org/10.1109/ACCESS.2019.2906261. 
14. Liu K, Wang J, Zhu C, Hong Y. Development of upper cycling clothes using 
3D-to-2D flattening technology and evaluation of dynamic wear comfort from 
the aspect of clothing pressure. Int J Cloth Sci Technol. 2016;28(6):736-49. doi: 
http://dx.doi.org/10.1108/IJCST-02-2016-0016. 
15. Liu K, Kamalha E, Wang J, Agrawal T-K. Optimization Design of Cycling 
Clothes' Patterns Based on Digital Clothing Pressures. Fiber Polym. 
2016;17(9):1522-9. doi: http://dx.doi.org/10.1007/s12221-016-6402-2. 
16. Tisserand Y, Cuel L, Magnenat-Thalmann N. Automatic 3D garment positioning 
based on surface metric. Comput Animat Virt W. 2017;28(3-4):e1770. doi: 
http://dx.doi.org/10.1002/cav.1770. 
17. Shin E, Baytar F. Apparel Fit and Size Concerns and Intentions to Use Virtual 
Try-On: Impacts of Body Satisfaction and Images of Models' Bodies. Cloth & 
Textiles 
Res 
J. 
2013;32(1):20-33. 
doi: 
http://dx.doi.org/10.1177/0887302x13515072. 
18. Chen X, Tao X, Zeng X, Koehl L, Boulenguez-Phippen J. Control and 
optimization of human perception on virtual garment products by learning from 


---

 
experimental 
data. 
Knowl-Based 
Syst. 
2015;87:92-101. 
doi: 
https://doi.org/10.1016/j.knosys.2015.05.031. 
19. Thomassey S, Bruniaux P. A template of ease allowance for garments based on a 
3D reverse methodology. Int J Ind Ergonom. 2013;43(5):406-16. doi: 
http://dx.doi.org/10.1016/j.ergon.2013.08.002. 
20. Zhang X, Yeung K, Li Y. Numerical simulation of 3D dynamic garment pressure. 
Text 
Res 
J. 
2002;72(3):245-52. 
doi: 
http://dx.doi.org/10.1177/004051750207200311. 
21. Lu Y, Song G, Li J. A novel approach for fit analysis of thermal protective 
clothing 
using 
three-dimensional 
body 
scanning. 
Appl 
Ergon. 
2014;45(6):1439-46. doi: http://dx.doi.org/10.1016/j.apergo.2014.04.007. 
22. Meng Y, Mok PY, Jin X. Computer aided clothing pattern design with 3D 
editing and pattern alteration. Comput-Aided Des. 2012;44(8):721-34. doi: 
http://dx.doi.org/10.1016/j.cad.2012.03.006. 
23. Jakob EM, Marshall SD, Uetz GW. Estimating Fitness: A Comparison of Body 
Condition 
Indices. 
Oikos. 
1996;77(1):61-7. 
doi: 
http://dx.doi.org/10.2307/3545585. 
24. Liu K, Zeng X, Wang J, Tao X, Xu J, Jiang X, et al. Parametric design of 
garment flat based on body dimension. Int J Ind Ergonom. 2018;65:46-59. doi: 
https://doi.org/10.1016/j.ergon.2018.01.013. 
25. Liu K, Zeng X, Bruniaux P, Tao X, Yao X, Li V, et al. 3D Interactive garment 
pattern-making 
technology. 
Comput-Aided 
Des. 
2018;104:113-24. 
doi: 
https://doi.org/10.1016/j.cad.2018.07.003. 
26. Boonbrahm P, Kaewrat C, Boonbrahm S. Realistic Simulation in Virtual Fitting 
Room Using Physical Properties of Fabrics. Procedia Comput SCI. 2015;75:12-6. 
doi: http://dx.doi.org/10.1016/j.procs.2015.12.189. 
27. Guo Z, Wong W, Leung S, Li M. Applications of artificial intelligence in the 
apparel 
industry: 
a 
review. Text 
Res J. 2011;81(18):1871-92. doi: 
http://dx.doi.org/10.1177/0040517511411968. 
28. Xue Z, Zeng X, Koehl L, Shen L. Interpretation of Fabric Tactile Perceptions 
through Visual Features for Textile Products. J Sens Stud. 2016;31(2):143-62. 
doi: http://dx.doi.org/10.1111/joss.12201. 
29. Chan APC, Yang Y, Wong FKW, Chan DWM, Lam EWM. Wearing comfort of 
two construction work uniforms. Constr Innov. 2015;15(4):473-92. doi: 
http://dx.doi.org/10.1108/CI-06-2015-0037. 
30. Majumdar A, Das A, Hatua P, Ghosh A. Optimization of woven fabric 
parameters for ultraviolet radiation protection and comfort using artificial neural 
network and genetic algorithm. Neural Comput Appl. 2016;27(8):2567-76. doi: 
http://dx.doi.org/10.1007/s00521-015-2025-6. 
31. Pierola A, Epifanio I, Alemany S. An ensemble of ordered logistic regression 
and random forest for child garment size matching. Computers & Industrial 


---

 
Engineering. 
2016;101(Supplement 
C):455-65. 
doi: 
https://doi.org/10.1016/j.cie.2016.10.013. 
32. Hamad M, Thomassey S, Bruniaux P. A new sizing system based on 3D shape 
descriptor for morphology clustering. Computers & Industrial Engineering. 
2017;113(Supplement C):683-92. doi: https://doi.org/10.1016/j.cie.2017.05.030. 
33. Wang L, Zeng X, Koehl L, Chen Y. Intelligent Fashion Recommender System: 
Fuzzy Logic in Personalized Garment Design. IEEE Trans Human-mach syst. 
2015;45(1):95-109. doi: http://dx.doi.org/10.1109/THMS.2014.2364398. 
34. Lee CKH, Choy KL, Ho GTS, Lam CHY. A slippery genetic algorithm-based 
process mining system for achieving better quality assurance in the garment 
industry. 
Expert 
Syst 
Appl. 
2016;46:236-48. 
doi: 
http://dx.doi.org/10.1016/j.eswa.2015.10.035. 
35. Choi S, Yang Y, Yang B, Cheung H. Item-level RFID for enhancement of 
customer shopping experience in apparel retail. Comput Ind. 2015;71:10-23. doi: 
http://dx.doi.org/10.1016/j.compind.2015.03.003. 
36. Fallahpour A, Olugu EU, Musa SN, Khezrimotlagh D, Wong KY. An integrated 
model for green supplier selection under fuzzy environment: application of data 
envelopment analysis and genetic programming approach. Neural Comput Appl. 
2016;27(3):707-25. doi: http://dx.doi.org/10.1007/s00521-015-1890-3. 
37. Li Q, Yu J-Y, Mu B-C, Sun X-D. BP neural network prediction of the 
mechanical properties of porous NiTi shape memory alloy prepared by thermal 
explosion 
reaction. 
Mat 
Sci 
Eng 
A-Struct. 
2006;419(1):214-7. 
doi: 
https://doi.org/10.1016/j.msea.2005.12.027. 
38. Jiang Y, Zuxin X, Hailong Y. Study on improved BP artificial neural networks in 
eutrophication 
assessment 
of 
China 
eastern 
lakes. 
J 
Hydrodyn. 
2006;18(3):528-32. doi: https://doi.org/10.1007/BF03400500. 
39. Chattaraman V, Simmons KP, Ulrich PV. Age, Body Size, Body Image, and Fit 
Preferences of Male Consumers. Cloth & Textiles Res J. 2013;31(4):291-305. 
doi: http://dx.doi.org/10.1177/0887302x13506111. 
40. Breiman 
L. 
Random 
forests. 
Mach 
Learn. 
2001;45(1):5-32. 
doi: 
http://dx.doi.org/10.1023/A:1010933404324. 
 
