# MVVM

## OOP architecture

**MVVM** (**Model–view–viewmodel**) is an OOP software architecture model. Its core is to separate the logic and view of our application to improve code maintainability and application robustness. We can use a picture to describe:

```text
View ⇄ ViewModel ⇄ Model
```

To explain, the View (view layer) is responsible for maintaining the UI structure and style, and is responsible for data binding with the ViewModel (view model). The data binding relationship here is two-way, that is, the ViewModel (view model) data occurs. Changes will trigger the update of the View (view layer), and at the same time changes in the data of the view layer will trigger the changes of the ViewModel (view model). Model is more biased towards the actual business data processing model. Both ViewModel and Model are congested models, and both are injected with business logic from different fields. For example, the business logic of ViewModel is more biased towards the domain logic of the view interaction layer, while the business logic of Model is more biased towards the processing logic of business data.

So, what should the Formivue solution be positioned in MVVM?

`@formivue/vue` connects the View to the form state in `@formivue/core`.
The core form and field models act as the ViewModel.

Where is the Model layer?

Of course it is our actual business code layer, this layer formivue will not manage, so at this layer, whether users maintain a Model in OOP mode or maintain a series of business logic function sets in FP mode, formivue Don't care.

Therefore, this also makes formivue's intrusion into the business very low, because formivue's goal is to reduce the cost of users designing ViewModels, allowing users to focus more on the realization of business logic.

## FP architecture

A rendering function can express the view as **UI = render(state)**.
In Formivue, a Vue template or render function reads observable form and field
state. User input flows back through the field model, and changes to state
schedule updates for dependent views.
