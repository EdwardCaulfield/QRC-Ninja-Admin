# Build image
# - This must be executed every time we make changes to:
# -- Project files
# -- Dockerfile
docker build -t qrc-ninja .

# Run docker container interactive
docker run -it --rm qrc-ninja /bin/bash

# Run docker container with jasmine
docker run -it --rm qrc-ninja jasmine

# Run docker container with coverage reporting
docker run -it --rm qrc-ninja nyc --reporter=lcov --reporter=text-lcov jasmine

####################################################

# To build image with Gitlab CI/CD (.gitlab-ci.yml)
# End test with this image

stages:
  - build
  - test

variables:
  CONTAINER_TEST_IMAGE: git.mambits.ch:4567/360grad/qrc-ninja:$CI_BUILD_REF

.build_defaults: &build_defaults
  tags:
    - shell-runner

build-image:
  <<: *build_defaults
  stage: build
  script:
    - docker build -t $CONTAINER_TEST_IMAGE .
    - docker push $CONTAINER_TEST_IMAGE

.test_stage_defaults: &test_stage_defaults
  stage: test
  image: $CONTAINER_TEST_IMAGE


jasmine test:
  <<: *test_stage_defaults
  script:
  - nyc --reporter=lcov --reporter=text-lcov jasmine
  artifacts:
    paths:
      - coverage/
    when: always
