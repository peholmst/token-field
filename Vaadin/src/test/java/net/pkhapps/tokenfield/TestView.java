package net.pkhapps.tokenfield;

import com.vaadin.flow.component.button.Button;
import com.vaadin.flow.component.notification.Notification;
import com.vaadin.flow.component.orderedlayout.VerticalLayout;
import com.vaadin.flow.component.textfield.TextField;
import com.vaadin.flow.router.Route;

import java.util.Collections;
import java.util.stream.Collectors;

@Route("")
public class TestView extends VerticalLayout {

    public TestView() {
        TokenField<String> stringTokenField = new TokenField<>();
        stringTokenField.setItems("TokenA", "TokenB", "TokenC", "TokenD");
        stringTokenField.setNewItemHandler(TokenField::addItem);
        stringTokenField.setLabel("Token Field");
        add(stringTokenField);

        TextField textField = new TextField();
        textField.setLabel("Text Field");
        add(textField);

        TokenBubbleField<String> stringTokenBubbleField = new TokenBubbleField<>();
        stringTokenBubbleField.setLabel("Token Bubble Field");
        stringTokenBubbleField.setItems("TokenA", "TokenB", "TokenC", "TokenD");
        stringTokenBubbleField.addValueChangeListener(event -> Notification.show("Tokens: " + String.join("", event.getValue())));
        add(stringTokenBubbleField);

        Button setValuesProgrammatically = new Button("Set Values Programmatically", event -> {
            stringTokenBubbleField.setValue(Collections.singleton("TokenC"));
        });
        add(setValuesProgrammatically);
    }
}
