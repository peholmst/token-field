package net.pkhapps.tokenfield;

import java.io.Serializable;

/**
 * TODO Document me!
 *
 * @param <V>
 */
@FunctionalInterface
public interface NewItemHandler<V> extends Serializable {

    void handleNewItem(TokenField<V> tokenField, String token);
}
