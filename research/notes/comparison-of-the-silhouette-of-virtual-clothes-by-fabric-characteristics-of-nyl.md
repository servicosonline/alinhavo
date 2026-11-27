---
title: Comparison of the Silhouette of Virtual Clothes by Fabric Characteristics of
  Nylon Fabric for the Utilization of Virtual Clothes
id: comparison-of-the-silhouette-of-virtual-clothes-by-fabric-characteristics-of-nyl
tags:
- modelista-producao-moda-dores-0698af
- 3d-prototyping
- clo3d
- fabric-parameters
created: '2026-11-27T06:21:20.515557Z'
updated: '2026-11-27T06:23:10.955608Z'
source: https://doi.org/10.1021/acsomega.2c06302
source_domain: doi.org
fetched_at: '2026-11-27T06:21:20.514553Z'
fetch_provider: crawl4ai
status: draft
type: note
tier: institutional
content_type: paper
deprecated: false
summary: ACS Omega 2022 (open-access via Europe PMC). Mediu propriedades fisicas de
  57 tecidos de nylon para jaquetas corta-vento (de um acervo de ~280 tecidos planos
  na Coreia; gramatura 30-150 g/m2, media 82 g/m2; espessura 0,07-0,41 mm, media 0,21
  mm) comparando o sistema KES-FB (amostras 20x20 cm) e o CLO Fabric Kit (tiras 22x3
  cm em urdume, trama e vies) em relacao ao coeficiente de caimento (drape ratio,
  KS K ISO 9073-0:2008). Regressao multipla mostrou que as variaveis do KES-FB explicam
  85% da variancia do caimento (R2=0,85, Durbin-Watson=1,771, VIF de cisalhamento
  >10 com multicolinearidade), enquanto o CLO Fabric Kit explica 75,3% (R2=0,753,
  Durbin-Watson=1,868, VIF<10). Rigidez a flexao (r=0,640 no KES-FB trama; r=0,721
  no CLO trama) e rigidez ao cisalhamento (r=0,626 no KES-FB; r=0,761 no CLO) apresentaram
  as maiores correlacoes com o caimento. Na simulacao 3D (CLO 3D) de 9 tecidos em
  um molde de jaqueta corta-vento, tecidos com drape ratios quase identicos (0,32
  vs 0,33; e 0,24 vs 0,25) mas pesos diferentes em cerca de 2x exibiram silhuetas
  distintas no avatar (tecidos mais pesados ficaram mais proximos ao corpo), demonstrando
  que a fidelidade do prototipo virtual depende da parametrizacao combinada de flexao,
  cisalhamento e gramatura, e que o teste simplificado do CLO Fabric Kit ainda deixa
  lacunas em relacao ao tecido real e nao captura efeitos de beneficiamento textil.
doi: 10.1021/acsomega.2c06302
oa_url: https://www.ebi.ac.uk/europepmc/webservices/rest/PMC9773953/fullTextXML
oa_source: europepmc
oa_version: publishedVersion
oa_license: cc by-nc-nd
oa_recovery_kind: rescued
---

> [!] **Recovered from an open-access copy. The source URL was never read.**
> https://doi.org/10.1021/acsomega.2c06302 could not be retrieved (Bot detection page: Just a moment...).
> Everything below — including the title and author metadata — is **the published version of record**, retrieved from <https://www.ebi.ac.uk/europepmc/webservices/rest/PMC9773953/fullTextXML> via europepmc. NOTHING in this note came from the source URL.
> Licence reported by europepmc: `cc by-nc-nd`.

*Suggested by [[three-dimensional-virtual-prototyping-for-designing-firefighting-gear-an-explora]] — Cited for empirical comparison of virtual garment silhouette by fabric characteristics*

# Comparison of the Silhouette of Virtual Clothes by Fabric Characteristics of Nylon Fabric for the Utilization of Virtual Clothes

## Abstract

In this study, various nylon fabrics were investigated to measure the physical properties of the actual fabric using Kawabata systems and CLO fabric kits, and the correlation between the physical and drape properties of the fabric was statistically analyzed. Subsequently, the CLO fabric kit results were used as basic data for the CLO three-dimensional (3D) virtual clothing program, and the drapeability of the virtual fabrics was measured. The factors with the most significant effect on the drape properties were analyzed by comparing the drape measurement of the real fabrics through the variable measurement of various fabrics and correlation analysis with the drape properties, and attempts were made to reduce the difference between real fabrics and their virtual implementations. The correlation analysis results revealed that both the Kawabata system and CLO fabric kit results indicated that the bending and shear properties exhibited the highest correlation with the drape ratio. In addition, the comparison of the real and virtual fabric images revealed that they exhibited a similar morphology. Furthermore, the results confirmed that the difference between the real and virtual fabrics could be reduced as much as possible when the values measured using the Kawabata system and CLO fabric kit were converted into a database. Subsequently, the differences between virtual fabrics with various thicknesses were confirmed through CLO 3D simulation. The findings of this study are expected to be used as basic data for building fabric database.

## Introduction

Recently, the widespread use of IT has expanded the fashion industry via the construction of design libraries, expansion of online platforms, improvement of consumer convenience, and provision of shopping information using AI through the convergence of three-dimensional (3D) technology. In addition, the commercialization of digital technology has exerted various economic effects, such as expense reduction and simplification of the design processes owing to reduced design, manufacturing, and production processes. Accordingly, 3D virtual wear technology has emerged as one of the important factors for reducing the design process of fabrics and creating competitiveness in the fashion industry.,

In addition to the fashion industry, the attitude of consumers is changing. For example, consumer consumption patterns have changed from the typical offline shopping behavior to online shopping behavior owing to the activation of nonface-to-face interaction due to the COVID-19 pandemic. Metaverse has attracted attention as a 3D immersive next-generation platform that can replace e-learning, web portals, and e-commerce., Therefore, online marketing using 3D virtual clothing has emerged as an important part of metaverse, and examples include metaverse marketing of luxury brands, virtual fashion shows, and marketing using virtual influencers., Consequently, research on the virtual expression of fabrics and clothing is considered essential.

The application of virtual reality in the clothing industry began in the 1980s. For example, 3D clothing virtual display technology based on virtual reality and digital simulation technology can be used in the design and production processes of clothing samples.− In addition, 3D simulation enables the implementation of various designs within a short time, as well as the evaluation of the look and fit of an apparel product without manufacturing a sample. However, the high dependence of this technology on traditional manual work and the difference in the characteristics of real fabric and its 3D implementation have limited the effective application of this technology. It is crucial to ensure that the drape and silhouette of a 3D simulation program are similar to those of a real fabric., Particularly, the virtual fabric should accurately reflect the properties of the real fabric for the realistic expression of the silhouette of virtual garments.

Lim and Istook investigated the change in the silhouette of a virtual costume applied to a virtual avatar with a change in the virtual fabric property. Yang investigated and correlated the drape properties of seam fabrics using experimental and hypothetical approaches. Lee et al. verified the objectivity and validity of the 3D virtual fabric simulation method by comparing the similarity between a real and virtual fabric when the 3D virtual fabric parameters obtained in a previous study were applied to the 3D virtual clothing simulation. Numerous studies have been conducted on virtual fabrics, clothing implementations, and the drape performance of clothing, which are the largest factors affecting the silhouette of clothing. However, studies that reflect changes in material properties are few compared to studies comparing the similarities of real and virtual clothes. In addition, comparative studies on images according to the physical characteristics of various materials are insufficient.,

Various 3D virtual programs have been widely employed, such as “CLO 3D” by CLO, which is a representative example used in Korea. Overseas, examples of 3D virtual programs include Israel’s Opitex’s “3D Runway Designer,” Browzwear’s “V-stitcher,” France’s Lectra’s “3D-Fit,” and Japan’s Technoa’s “i-Designer”.− To increase the similarity between CLO 3D-designed fabric and real clothes, the approximate physical properties of the fabric are measured using the CLO fabric kit provided by CLO, after which the properties are applied to the 3D virtual clothes to achieve a more similar appearance to the real clothes., However, there is a gap between actual fabrics and virtual fabrics created using the CLO fabric kit owing to the unnatural characteristics of virtual fabrics. Therefore, various emotional characteristics for e-commerce, such as clothing shopping in metaverse and virtual clothing fashion shows of virtual models, are insufficient. In addition, as the use of the CLO fabric kit for the measurement of the physical properties of fabrics is a simple test, accurate test results cannot be obtained.,

The Kawabata evaluation system (KES) is the first advanced and unique solution for the user-friendly testing of the mechanical properties of fabrics and has attracted tremendous attention in numerous countries owing to its highly precise and reproducible measurement.−

In this study, to verify the objectivity and validity of 3D virtual fabric simulations for a nylon fabric, the physical properties of the real fabric and the basic properties of the virtual fabric to be implemented were measured using KES and CLO fabric kit and the factors affecting the drape of the fabric were analyzed. Thereafter, the weight per unit area, thickness, bending stiffness, and tensile stiffness of synthetic fibers used for wind protection in real fabrics were measured, and their correlation with the drape performance of the fabric was derived from the analysis results. In addition, as drapes are visually classified,, the appearances of the virtual fabrics were compared by wearing windproof jackets made of various virtual fabrics with different physical properties on virtual avatars. This increased the similarity and reliability of the virtual fabric with the real fabric, and the result was used as the basic data for a new 3D virtual clothing simulation technique.

## Methods and Materials

### Materials

To obtain information on the drape performance of fabrics after building a woven fabric property database, approximately 280 woven fabrics were collected by receiving fabric information and samples from various fabric companies in Korea. Among the collected fabrics, 57 fabrics (weight: 30–150 gsm, average weight: 82 gsm; and thickness: 0.07–0.41, average thickness: 0.21 mm) with a mixing ratio of at least 70% nylon, which are mainly used in windproof jackets, were selected and used in this study.

### Objective Sensory Properties

#### KES-FB Properties

In this study, the bending properties of the real fabrics were measured using a fabric rating (FAST) system (CSIRO) based on Kawabata’s fabric rating system (KES-FB; KATO TECH). A square sample with a size of 20 × 20 cm was used as the test sample. After measuring the weight of the sample, the sample was subjected to compression, surface, bending, shear, and tensile tests, which are less damaging to the fabric.

To measure the weight of the sample, the average weight in the warp, weft, and bias directions was measured using an electronic scale, and the weight per unit area was obtained by dividing the measured weight by the fabric area. The sample thickness was determined using a thickness tester (No. 20465, Mitutoyo Co., Kawasaki, Japan) according to the ASTM D 5729-9 standard. The bending distance and length were measured using a bending test kit, and the bending stiffness was derived using according to the KS K ISO 9073-7 standard. summarizes the KES-FB test conditions.

*KES-FB Test Condition*

G: Bending stiffness.

M: Mass of specimen per unit area (g/m2).

C: Overall average bending length of the specimen (cm).

#### Drapeability

The drapeability was evaluated according to the KS K ISO 9073-0:2008 standard. The drape performance was evaluated using an acrylic cylinder with a diameter of 7.5 cm and a height of 30 cm, and a drape performance measuring device was designed to obtain the drooping appearance of a fabric at a certain location. For this experiment, circular-shaped samples with a diameter of 25 cm were prepared. During the experiment, after aligning the center of the cylinder with the center of the sample, images were taken using a high-resolution camera from the top and side directions to capture the sagging image of the fabric when naturally placed on the cylinder. To evaluate the drape performance, the area ratio of the top-view image was calculated using , and the drape ratio was obtained and digitized. In this case, the drape performance increased with a decrease in the drape ratio and vice versa.

### Sensory Images of 3D Virtual Fabrics

#### Physical Property Evaluation Using the CLO Fabric Kit

To evaluate the physical properties using the CLO fabric kit, the fabric was cut into a rectangular shape with a size of 22 × 3 cm. Samples were prepared in three directions: warp, weft, and bias. The experiments were conducted sequentially on the weight, thickness, bending stiffness, and tensile stiffness, which are less damaging to the fabric. To measure the weight, the average weight in the warp, weft, and bias directions was measured using an electronic scale, and the weight per unit area was obtained by dividing this by the fabric area. The thickness of the samples was measured using the thickness tester of the CLO kit according to the CLO fabric kit manual, and the bending distance and length were measured using a bending tester.

#### Virtual Image Implementation

The 3D virtual drape of the fabric was simulated using the CLO CAD program. 3D virtual simulation can accurately represent the shape of a drape and the physical properties of a fabric by inputting the mechanical property data values measured by the CLO fabric kit. Therefore, the 57 fabrics selected for the analysis of the windproof jackets were sorted based on their weight, and nine fabrics were used for this analysis, including three light-weight, three medium-weight, and three heavy-weight fabrics, to compare the differences in the drapes and appearance of the fabrics. Subsequently, the windbreak jacket pattern was worn on a virtual avatar, the virtual fabric was applied, and the CLO 3D virtual closing program was simulated.

### Statistical Analysis

Statistical analysis was performed using SPSS Win 18.0 program, and the scores of the real and virtual fabric evaluation were compared using the t-test. The relationships between the real and virtual evaluation modes, and the difference in the image of the subjective sensation of real clothing and virtual clothing, were evaluated using Pearson correlation coefficients.

## Results and Discussion

### KES and Drapeability Correlation Analysis Results

The correlation between the drape ratio and the weight, thickness, bending, shear, and tensile properties of the fabric in the warp–weft directions was analyzed using KES, and the regression model was summarized using multiple correlation analysis. The r2 value () indicated that approximately 85% of the drape ratio of the fabric can be expressed by the model, in which the independent variable is the dependent variable. Although the significance of the p-value was less than 0.05, the Durbin–Watson value was 1.771, and the residual independence was uncertain. The regression equation of this regression model is expressed in as follows:

*Regression Analysis Results of KES Variables*

shows the correlation between KES measurements and the drape ratio. The variance inflation factor (VIF) check revealed that the KES-FB shear stiffness (WARP and WEFT) was above 10, indicating the multicollinearity of the two independent variables (i.e., variables that were very similar were included in the independent variables). However, other variables that were very similar were not included as independent variables. In addition, the p-value value was greater than 0.05, indicating that the KES-FB thickness, elasticity (WEFT), and tensile properties (WARP, WEFT) had no significant effect on the dependent variable. In contrast, the weight, KES-FB bending stiffness (WARP, WEFT), KES-FB resilience, and KES-FB shear stiffness (WARP, WEFT) with a p-value of less than 0.05 significantly affected the dependent variables.

*Correlation between KES Measurements and the Drape Ratio*

### CLO Fabric Kit Measurement Result and Drape Ratio Correlation Analysis

The correlation between the drape ratio and CLO fabric kit measurements was analyzed by measuring the weight, thickness, bending, shear, and tensile properties in the warp–weft direction using the CLO fabric kit. The r2 value () indicated that this model can express approximately 75.3% of the drape ratio, in which the independent variable is the dependent variable. The Durbin–Watson value was 1.868, confirming the satisfaction of the residual independence, and the significance p value was less than 0.05, indicating the suitability of the regression model.

*Regression Analysis of CLO Fabric Kit Variables*

The regression equation of this regression model is expressed in , as follows.

shows the correlation between KES measurements and the drape ratio. The VIF check results were less than 10, indicating that there was no multicollinearity problem (Multicollinearity: when variables that are too similar are included in the independent variable). The p-values of the CLO weight per unit area, thickness, and shear stiffness were greater than 0.05, indicating that these variables did not significantly affect the dependent variable. In contrast, the p-value of the CLO bending stiffness (WARP and WEFT) was less than 0.05, indicating that they significantly affected the dependent variable.

*Correlation between CLO Fabric Kit Measurements and the Drape Ratio*

### Comparison of the Correlation between the KES-FB and CLO Fabric Kit Measurement Values

#### Weight and Thickness

The correlation between the drape ratio of KES-FB and CLO weight and the thickness values was below the expected value (). However, the correlation analysis revealed that the absolute values of “r” were similar in (a) and (b), and in (c) and (d). This indicates that although the KES-FB and CLO fabric kit instruments utilized different measurement principles, they exhibited similar effects on the drape ratio. This indicated that the CLO fabric kit and KES-FB equipment fabrics can be effectively utilized to measure the mechanical properties.

*Comparison of the correlation between the drape coefficient and weight and the thickness: (a) Kawabata evaluation system (KES)-FB weight, (b) CLO fabric kit weight, (c) KES-FB thickness, and (d) CLO fabric kit thickness.*

#### Bending Stiffness and Shear Stiffness

The drape property is a complex attribute of fabrics, and it mostly depends on the mechanical and physical properties of the fabric. Among the physical factors, the bending and shearing stiffness are considered as the most important and are known as the main dependent properties of fabric drapes. This study revealed a high correlation between the bending and shear properties of the fabric and their drape ratio, which is consistent with the findings of a previous study. In addition, the correlation between the drape coefficient and the bending and shear stiffness properties was high ( and ). The correlation coefficient between the KES-FB bending (WEFT) and CLO bending (WEFT) parameters and the drape ratios were 0.640 and 0.721, respectively. In addition, the correlation coefficient between the KES-FB shear (WEFT) and CLO bending parameters and the drape ratio was 0.626 and 0.761, respectively. The correlation coefficients of the bending and shear stiffness parameters with the drape ratio of the KES-FB and CLO analysis were very similar. This confirmed the high correlation between the drape of the fabric and the shear stiffness and bendability of the fabric. In addition, as the correlation coefficients of KES-FB and the CLO fabric kit exhibited a similar trend, it was expected that the virtual fabric can be implemented in the CLO 3D using the physical properties of the real fabric.

*Comparison of the correlation coefficient between the drape ratio and bending stiffness: (a) KES-FB (WARP direction), (b) CLO fabric kit (WARP direction), (c) KES-FB (WEFT direction), and (d) CLO fabric kit (WEFT direction).*

*Comparison of the correlation coefficient of the drape and shear stiffness: (a) KES-FB (WARP direction), (b) KES-FB (WEFT direction), and (c) CLO fabric kit.*

#### Virtual Image Implementation Using CLO 3D Virtual Fabric

The weight and drape characteristics of the selected fabric are shown in . The comparison of the weight and number of nodes revealed that the number of nodes tended to increase with an increase in the weight. This was consistent with the findings of Carrera et al., Hu and Chung, and Kenkare and May-Plumlee, which reported that the number of nodes is an important factor in drape sensitivity and that the drape performance increases with an increase in the number of nodes.,, The comparison of the drape properties of real and virtual fabrics indicated that there was no external difference (). We believe that this may be related to the high correlation between KES-FB and the CLO fabric kit drape ratio, which was observed in this study, and further verifies the feasibility of implementing virtual fabrics in CLO 3D. Therefore, a windproof jacket pattern () was used to compare the appearance of fabrics with different weights but similar drape ratios after virtual wear, and the results are shown in . The weights of the two fabrics with similar drape ratios of 0.32 and 0.33 were 3.74 and 7.07, respectively, which were approximately two times different. In addition, the virtual fitting of the windproof jacket pattern confirmed that the heavy fabric exhibited a softer silhouette. In the case of two fabrics with similar drape ratios of 0.24 and 0.25, their weight was 7.17 and 14.44, respectively, which was approximately two times different. Similarly, the heavier fabric was closer to the body of the avatar and exhibited a softer silhouette. This result indicated that even if the fabrics exhibit a similar drape ratio, the silhouette appearance differs with a change in the weight. In addition, the possibility of making a clothing prototype using a virtual fabric implemented with the physical properties of the fabric was confirmed.

*Windproof jacket patterns for the comparison of the silhouette of different virtual fabrics.*

*Physical Properties of Real and Virtual Fabrics*

*Comparison of the Drape Properties of Real and Virtual Fabrics*

*Comparison of the CLO 3D Virtual Clothes Implemented Using Virtual Fabrics with Different Weights*

## Conclusions

In this study, to reduce the difference between the appearance of a real fabric and its virtual implementation, the correlation between the physical properties of the fabric and the drape was analyzed. Although the KES-FB and CLO 3D virtual clothing program utilize different measuring instruments, they exhibited similar correlations between each parameter. Statistical analysis revealed a high correlation between the drape thickness and multiple regression models of the drape tensile properties. In addition, a high correlation was observed between the drape bending stiffness and the drape shear stiffness, which was the main parameter that affected the drape.

After the correlation analysis, a virtual prototype with the pattern of an actual commercially available women’s windbreaker jacket implemented using the virtual fabric was created using the CLO 3D program. The results confirmed the application of the virtual fabric to a single item in various ways by implementing clothes with the same shape as the real one. However, one of the limitations of this study is that it did not derive the effect of fabric processing. As a follow-up study, we intend to conduct research on the effect and correlation of fabric processing on drape characteristics and garment silhouette.

As the textile industry researches ways to increase the possibility of realizing virtual fabrics and clothing in the 4th industrial revolution era, objective evaluation systems, such as KES-FB and CLO, will continue to be used as basic systems and play an important role in the future. In addition, it is believed that the virtual fabrication of clothing prototypes using virtual fabrics will also play an important role.